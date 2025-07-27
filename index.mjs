import knex from "/opt/nodejs/db.js";
import DatabaseTableConstants from "/opt/nodejs/DatabaseTableConstants.js";
import {
  checkMoreThan3Categories,
  checkNotRelevantCategories,
  checkMoreThan5ServiceAreas,
  checkMissingHoursWebDescription,
  checkSuspiciousReviews,
  checkPolicyViolations,
  checkFakeAddress
} from "./utils/utils.js";

export const handler = async (event) => {
  const gmbData = event.Records.map((r) => JSON.parse(r.body));
  console.log("GMB data:", JSON.stringify(gmbData, null, 2));
    
  try {  
    const results = await Promise.all(
      gmbData.map(async (record) => {
        try {
          console.log('Processing message:', record);
          
          const result = await processGmbData(record);
          return result;
          
        } catch (error) {
          console.error('Error processing record:', error);
          return {
            success: false,
            error: error.message,
            record: record
          };
        }
      })
    );
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed GMB data checks',
        results: results
      }),
    };
    
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
    };
  }
};

async function processGmbData(data) {
  if (!data || !data.gmb_id) {
    throw new Error('Invalid GMB data: missing gmb_id');
  }

  const {
    gmb_id,
    primary_category,
    additional_categories,
    service_areas,
    website_uri,
    regular_hours,
    region_code,
    address_lines,
    locality,
    administrative_area,
    sublocality,
    postal_code,
    description,
    reviews_dates,
    posts_text,
    answers_text
  } = data;
  
  console.log(`Processing GMB ID: ${gmb_id}`);
  
  try {
    const [
      isMoreThan3Categories,
      isNotRelevantCategories,
      isMoreThan5ServiceAreas,
      isMissingHoursWebDescription,
      isSuspiciousReviews,
      PolicyViolationsResult,
      isFakeAddress
    ] = await Promise.all([
      checkMoreThan3Categories(additional_categories),
      checkNotRelevantCategories(primary_category, additional_categories),
      checkMoreThan5ServiceAreas(service_areas),
      checkMissingHoursWebDescription(regular_hours, website_uri, description),
      checkSuspiciousReviews(reviews_dates),
      checkPolicyViolations(description, posts_text, answers_text),
      checkFakeAddress(address_lines, locality, administrative_area, postal_code, region_code)
    ]);
    
    const updateData = {
      is_more_than_3_categories: isMoreThan3Categories,
      is_not_relevant_categories: isNotRelevantCategories,
      is_more_than_5_service_areas: isMoreThan5ServiceAreas,
      is_missing_hours_web_description: isMissingHoursWebDescription,
      is_suspicious_reviews: isSuspiciousReviews,
      is_policy_violations: PolicyViolationsResult.isPolicyViolations,
      // policy_violations_note: PolicyViolationsResult.note,
      // policy_violations_checked_at: new Date().toISOString(),
      is_fake_address: isFakeAddress,
    };
    
    console.log(`Updating GMB ID ${gmb_id} with data:`, updateData);
    
    await knex(DatabaseTableConstants.GMB_LOCATION_TABLE)
      .where('gmb_id', gmb_id)
      .update(updateData);
    
    console.log(`Successfully updated GMB ID: ${gmb_id}`);
    
    return {
      success: true,
      gmb_id: gmb_id,
      checks: updateData
    };
    
  } catch (error) {
    console.error(`Error processing GMB ID ${gmb_id}:`, error);
    throw error;
  }
}
