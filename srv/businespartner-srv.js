const cds = require('@sap/cds')

module.exports = class BusinessPartnerService extends cds.ApplicationService {
  init() {

    const { BusinessPartners } = cds.entities('BusinessPartnerService')

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
      await UPSERT.into(BusinessPartners).entries([bp])

      // Return updated business partner except embedding
      return SELECT.one.from(BusinessPartners)
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
      console.log('On similaritySearch', req.data)
      return []
    })

    return super.init()
  }
}
