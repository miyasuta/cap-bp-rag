using {managed} from '@sap/cds/common';
namespace bp.rag;

@assert.unique.bpId: [businessPartnerID]
entity BusinessPartner: managed {
  key businessPartnerUUID: UUID;
  businessPartnerID: String(10);
  fullData: String(1000);
  text: String(1000);
  textEmbedding : Vector(1536);
  textEmbeddingStr : String;
}