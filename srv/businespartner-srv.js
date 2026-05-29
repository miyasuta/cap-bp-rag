const cds = require('@sap/cds')
const { OpenAIUtil } = require('./utils/OpenAIUtil')

const LOG = cds.log('bp-rag')

module.exports = class BusinessPartnerService extends cds.ApplicationService {
  async init() {
    const { BusinessPartners } = cds.entities('BusinessPartnerService')
    this.db = await cds.connect.to('db')
    this.openai = new OpenAIUtil()
    const { BusinessPartner } = this.db.entities
    this.BusinessPartner = BusinessPartner

    this.on('CREATE', BusinessPartners, async (req, next) => {
      const bp = req.data
      const businessPartnerUUID = bp.businessPartnerUUID

      // convert string to embedding
      const s = bp.textEmbeddingStr;
      if (s) {
        let arr;
        try {
          arr = JSON.parse(s);  // [num, num, ...]
        } catch (e) {
          return req.reject(400, `textEmbeddingStr is not valid JSON: ${e.message}`);
        }
        if (!Array.isArray(arr)) {
          return req.reject(400, 'textEmbeddingStr must be a JSON array of numbers');
        }
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
      LOG.info('similaritySearch', query)
      try {
        return await this.findSimilar(query)
      } catch (e) {
        LOG.error('similaritySearch failed', e)
        return req.reject(502, 'Failed to perform similarity search')
      }
    })

    this.on('ask', async (req) => {
      const { query } = req.data
      try {
        const context = await this.findSimilar(query)

        if (!context || context.length === 0) {
          return 'No relevant business partner found.'
        }

        LOG.debug('Context for question:', context)

        return await this.openai.response(query, JSON.stringify(context))
      } catch (e) {
        LOG.error('ask failed', e)
        return req.reject(502, 'Failed to generate answer')
      }
    })

    this.on('deleteAll', async (req) => {
      await DELETE.from(BusinessPartner)
      return 'All business partners deleted'
    })

    return super.init()
  }

  async findSimilar(query) {
    const queryEmbedding = await this.openai.getEmbedding(query)

    return await SELECT.from(this.BusinessPartner)
      .columns`businessPartnerID,
                                        fullData,
                                        cosine_similarity(
                                          textEmbedding, to_real_vector(
                                          ${JSON.stringify(queryEmbedding)}
                                        )) as similarityScore`
      .orderBy`similarityScore desc`
      .limit(3)
  }
}
