/**
 * Azure OpenAI API client for intelligent anomaly analysis
 */

const azureOpenAIBase = import.meta.env.VITE_AZURE_OPENAI_BASE
const azureOpenAIKey = import.meta.env.VITE_AZURE_KEY
const azureOpenAIDeployment = import.meta.env.VITE_DEPLOYMENT_NAME
const azureOpenAIApiVersion = import.meta.env.VITE_API_VERSION || '2024-02-15-preview'

interface AnomalyContext {
  anomalyType: 'hourly' | 'daily'
  anomalyTime: string
  metric: string
  metricValue: number
  previousValue?: number
  delta?: number | null
  alerts: Array<{
    source: string
    priority: string
    severity: string
    alert_name: string
    message: string
    triggered_at: string
    host?: string
    path?: string
    status_code?: string
    mappings?: Array<{
      domain: string
      metric: string
      confidence: string
      notes: string
    }>
  }>
}

export interface AnomalyAnalysis {
  summary: string
  rootCause: string
  affectedSystems: string[]
  timeline: string
  recommendations: string[]
  confidence: number
}

export async function analyzeAnomaly(context: AnomalyContext): Promise<AnomalyAnalysis> {
  if (!azureOpenAIBase || !azureOpenAIKey || !azureOpenAIDeployment) {
    throw new Error('Azure OpenAI configuration missing. Please set VITE_AZURE_OPENAI_BASE, VITE_AZURE_KEY, and VITE_DEPLOYMENT_NAME')
  }

  const systemPrompt = `You are an expert AI monitoring agent analyzing business metric anomalies. Your role is to:
1. Analyze metric drops/spikes in the context of correlated alerts
2. Identify root causes by examining alert patterns, sources, and metadata
3. Determine which systems, domains, and metrics are affected
4. Provide actionable insights and recommendations

Always be specific, data-driven, and focus on actionable insights.`

  const userPrompt = `Analyze this anomaly and provide a comprehensive analysis:

**Anomaly Details:**
- Type: ${context.anomalyType === 'hourly' ? 'Hourly' : 'Daily'} metric anomaly
- Time: ${context.anomalyTime}
- Metric: ${context.metric}
- Current Value: ${context.metricValue.toLocaleString()}
${context.previousValue ? `- Previous Value: ${context.previousValue.toLocaleString()}` : ''}
${context.delta !== null && context.delta !== undefined ? `- Change: ${context.delta.toFixed(2)}%` : ''}

**Correlated Alerts (${context.alerts.length} alerts found):**
${context.alerts.map((alert, idx) => `
${idx + 1}. **${alert.alert_name}**
   - Source: ${alert.source}
   - Priority: ${alert.priority || 'N/A'}
   - Severity: ${alert.severity || 'N/A'}
   - Time: ${alert.triggered_at}
   - Message: ${alert.message || 'N/A'}
   ${alert.host ? `- Host: ${alert.host}` : ''}
   ${alert.path ? `- Path: ${alert.path}` : ''}
   ${alert.status_code ? `- Status: ${alert.status_code}` : ''}
   ${alert.mappings && alert.mappings.length > 0 ? `
   - Metric Mappings:
     ${alert.mappings.map(m => `* Domain: ${m.domain}, Metric: ${m.metric}, Confidence: ${m.confidence}, Notes: ${m.notes || 'N/A'}`).join('\n     ')}` : ''}
`).join('\n')}

**Please provide:**
1. A concise summary (2-3 sentences) of what happened
2. Root cause analysis based on the alerts and their patterns
3. List of affected systems/domains/metrics
4. Timeline of events
5. Actionable recommendations
6. Confidence level (0-1) in your analysis

Format your response as JSON:
{
  "summary": "...",
  "rootCause": "...",
  "affectedSystems": ["system1", "system2"],
  "timeline": "...",
  "recommendations": ["rec1", "rec2"],
  "confidence": 0.85
}`

  try {
    const url = `${azureOpenAIBase}/openai/deployments/${azureOpenAIDeployment}/chat/completions?api-version=${azureOpenAIApiVersion}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureOpenAIKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 1,
        max_completion_tokens: 10000
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from Azure OpenAI')
    }

    // Try to parse JSON from the response
    let analysis: AnomalyAnalysis
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : content
      const parsed = JSON.parse(jsonContent.trim())
      
      // Ensure all fields are strings/arrays, not objects
      analysis = {
        summary: typeof parsed.summary === 'string' ? parsed.summary : JSON.stringify(parsed.summary || 'Analysis generated'),
        rootCause: typeof parsed.rootCause === 'string' ? parsed.rootCause : JSON.stringify(parsed.rootCause || 'Root cause analysis'),
        affectedSystems: Array.isArray(parsed.affectedSystems) 
          ? parsed.affectedSystems.map((s: any) => typeof s === 'string' ? s : String(s))
          : [],
        timeline: typeof parsed.timeline === 'string' ? parsed.timeline : JSON.stringify(parsed.timeline || context.anomalyTime),
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.map((r: any) => typeof r === 'string' ? r : String(r))
          : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : parseFloat(parsed.confidence) || 0.7
      }
    } catch {
      // If JSON parsing fails, create a structured response from text
      analysis = {
        summary: content.split('\n')[0] || 'Analysis generated',
        rootCause: content,
        affectedSystems: [],
        timeline: context.anomalyTime,
        recommendations: [],
        confidence: 0.7
      }
    }

    return analysis
  } catch (error) {
    console.error('Azure OpenAI analysis error:', error)
    throw error
  }
}

