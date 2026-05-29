const cds = require('@sap/cds')
const OpenAI = require('openai')

const LOG = cds.log('openai')

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
        LOG.debug('Input for LLM:', `Question: ${query}\n\nContext: ${context}`)
        const response = await this.openai.responses.create({
            model: "gpt-4o-mini",
            instructions: 'You are a helpful assistant. Answer the question based on the following context. If the answer cannot be found in the context, say you do not know.',
            input: `Question: ${query}\n\nContext: ${context}`,
        })
        LOG.debug('LLM Response:', response)
        return response.output_text
    }
}

module.exports.OpenAIUtil = OpenAIUtil