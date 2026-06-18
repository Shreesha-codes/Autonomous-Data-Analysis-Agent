import dotenv from 'dotenv';
dotenv.config();

export interface ILLMResult {
  code: string;
  narrativeSummary: string;
  narrativeInsights: string[];
}

export const generateCodeFromQuery = async (
  question: string,
  dataProfile: any,
  datasetPath: string,
  failedCode?: string,
  errorLog?: string
): Promise<ILLMResult> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[LLM] No GEMINI_API_KEY found in environment. Running offline query simulation.');
    return simulateLLM(question, dataProfile);
  }

  const isCorrection = failedCode && errorLog;

  const systemInstruction = `
You are an expert Python data analyst AI. 
Your task is to translate a business question into pure, functional Python code.
You must use pandas to read and analyze the dataset located at: "${datasetPath}".
The data profile is: ${JSON.stringify(dataProfile)}.

Rules for code generation:
1. Always output ONLY valid Python code wrapped in \`\`\`python ... \`\`\` blocks.
2. Load the dataset using \`df = pd.read_csv("${datasetPath.replace(/\\/g, '/')}")\` (or pd.read_json / pd.read_excel depending on format).
3. Always print your final results as a JSON string to stdout using: \`print(json.dumps(result))\` so the parent Node process can capture it. Do not print other debug output.
4. Ensure variables printed to stdout are serialized correctly.

For narrative generation:
Please also provide a brief summary and 3 key insights based on the query. Since we want to return both the code and the narrative in one LLM call, format the response as a JSON string containing:
{
  "code": "your python code",
  "summary": "a narrative summary of what the query accomplishes",
  "insights": ["insight 1", "insight 2", "insight 3"]
}
`;

  let prompt = `Question: "${question}"`;
  if (isCorrection) {
    prompt += `\n\nYour previous code failed with this error:\n${errorLog}\n\nHere was the failed code:\n${failedCode}\n\nPlease output corrected code following the rules above.`;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemInstruction },
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const json = (await response.json()) as any;
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const parsed = JSON.parse(rawText.trim());
      return {
        code: cleanCodeBlock(parsed.code),
        narrativeSummary: parsed.summary || `Executed analysis for "${question}"`,
        narrativeInsights: parsed.insights || ['Successfully run query']
      };
    }
  } catch (error) {
    console.error('[LLM] Gemini request failed, using simulation backup:', error);
  }

  return simulateLLM(question, dataProfile);
};

const cleanCodeBlock = (code: string): string => {
  if (code.includes('```python')) {
    return code.split('```python')[1].split('```')[0].trim();
  }
  if (code.includes('```')) {
    return code.split('```')[1].split('```')[0].trim();
  }
  return code.trim();
};

const simulateLLM = (question: string, dataProfile: any): ILLMResult => {
  // Return simulation mockup
  const columns = dataProfile?.columns?.map((c: any) => c.name) || ['metric'];
  const colName = columns[0];
  
  const code = `import pandas as pd
import json

# Simulated pandas computation
# Loaded dataset
data = {
    "${colName}": [10, 20, 30, 40, 50, 100],
    "category": ["A", "B", "A", "B", "A", "B"]
}
df = pd.DataFrame(data)

# Aggregate grouping
result = df.groupby("category").describe().to_dict()
print(json.dumps({"status": "success", "result": result, "query": "${question}"}))
`;

  return {
    code,
    narrativeSummary: `Simulated analysis response for "${question}". This demonstrates offline simulation when GEMINI_API_KEY is not configured.`,
    narrativeInsights: [
      `Data profile contains columns: ${columns.join(', ')}`,
      `Grouped metrics calculations by category fields`,
      `Standard distribution computed successfully`
    ]
  };
};
