const OpenAI = require('openai')

class OpenAIUtil {
    constructor() {
        this.openai = new OpenAI()
    }

    async getEmbedding(input) {
        const response = await this.openai.embeddings.create({
            model: "text-embedding-3-small",
            input: input,
            encoding_format: "float"
        })
        return response.data[0].embedding
    }
    
    async response(query, context) {
        const response = await this.openai.responses.create({
            model: "gpt-4o-mini",
            instructions: 'Answer the question based on the following context. If the answer cannot be found in the context, say you do not know.',
            input: `Context: ${context}\n\nQuestion: ${query}`,
        })
        return response.output_text
    }
}

module.exports.OpenAIUtil = OpenAIUtil