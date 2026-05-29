const cds = require('@sap/cds')
const { OpenAIUtil } = require('./utils/OpenAIUtil')

module.exports = class BusinessPartnerService extends cds.ApplicationService {
  async init() {
    const { BusinessPartners } = cds.entities('BusinessPartnerService')
    const db = await cds.connect.to('db')
    const { BusinessPartner } = db.entities

    this.on('CREATE', BusinessPartners, async (req, next) => {
      const bp = req.data
      const businessPartnerUUID = bp.businessPartnerUUID

      // convert string to embedding
      const s = bp.textEmbeddingStr;
      if (s) {
        const arr = JSON.parse(s);  // [num, num, ...]
        // if (arr.length !== 1536) {
        //   req.reject(400, `Expected 1536 dims, got ${arr.length}`);
        // }
        bp.textEmbedding = `[${arr.join(',')}]`;
        delete bp.textEmbeddingStr;
      }
      await UPSERT.into(BusinessPartner).entries([bp]) // insert into DB

      // Return updated business partner except embedding
      return SELECT.one.from(BusinessPartner)
        .columns('businessPartnerUUID',
          'businessPartnerID',
          'fullData',
          'text',
          'createdAt',
          'createdBy',
          'modifiedAt',
          'modifiedBy')
        .where({ businessPartnerUUID })
    })

    this.on('similaritySearch', async (req) => {
      const { query } = req.data
      console.log('On similaritySearch', query)
      return await this.findSimilar(query)
    })

    this.on('ask', async (req) => {
      const { query } = req.data
      const context = await this.findSimilar(query)
      
      if (!context || context.length === 0) {
        return 'No relevant business partner found.'
      }

      console.log('Context for question:', context)

      const openai = new OpenAIUtil()
      const answer = await openai.response(query, JSON.stringify(context))
      return answer
    })

    this.on('deleteAll', async (req) => {
      const db = await cds.connect.to('db')
      const { BusinessPartner } = db.entities
      await DELETE.from(BusinessPartner)
      return 'All business partners deleted'
    })

    this.findSimilar = async (query) => {
      const openai = new OpenAIUtil()
      const queryEmbedding = await openai.getEmbedding(query)

      const result = await SELECT.from(BusinessPartner)
        .columns`businessPartnerID, 
                                          fullData, 
                                          cosine_similarity(
                                            textEmbedding, to_real_vector(
                                            ${JSON.stringify(queryEmbedding)}
                                          )) as similarityScore`
        .orderBy`similarityScore desc`
        .limit(3)
      return result
    }

    return super.init()
  }
}
