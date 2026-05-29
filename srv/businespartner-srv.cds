using {bp.rag as db} from '../db/schema';


service BusinessPartnerService {
  @insertonly
  entity BusinessPartners      as
    projection on db.BusinessPartner {
      *
    }
    excluding {
      textEmbedding
    };

  @readonly
  entity BusinessPartnerViewer as
    projection on db.BusinessPartner {
      *
    }
    excluding {
      textEmbedding
    };

  action similaritySearch(query: String) returns array of {
    businessPartnerID : String(10);
    fullData          : String(1000);
    similarityScore   : String;
  }

  action ask(query: String) returns String;

  action deleteAll() returns String;
}

annotate BusinessPartnerService with @requires: 'any'
