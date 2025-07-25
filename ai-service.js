export class AIService {
    constructor() {
        this.models = {
            'gpt-4': 'gpt-4',
            'claude': 'claude-3-sonnet'
        };
    }
    
    async generateCode(interpretation) {
        try {
            const prompt = this.buildPrompt(interpretation);
            
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are an AI pair programmer. Generate clean, modern web code based on user interactions.
Respond with a JSON object containing:
{
  "success": true,
  "project": {
    "files": {
      "filename.ext": "content"
    },
    "structure": {}
  }
}`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                json: true
            });
            
            return JSON.parse(completion.content);
        } catch (error) {
            console.error('AI generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    buildPrompt(interpretation) {
        const { action, type, positions } = interpretation;
        
        let prompt = `User performed a ${action} action with ${positions.length} interaction points. `;
        
        switch (action) {
            case 'create':
                prompt += `They want to create a new ${type}. The interaction points are: ${JSON.stringify(positions)}. Generate appropriate code.`;
                break;
            case 'modify':
                prompt += `They want to modify an existing ${type}. Update the relevant files.`;
                break;
            case 'connect':
                prompt += `They want to connect elements between positions: ${JSON.stringify(positions)}.`;
                break;
            case 'animate':
                prompt += `They want to add animation based on the interaction pattern.`;
                break;
            default:
                prompt += `Create something meaningful based on the interaction pattern.`;
        }
        
        return prompt;
    }
}

