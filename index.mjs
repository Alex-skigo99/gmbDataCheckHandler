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
  try {
    console.log('Processing SQS event:', JSON.stringify(event, null, 2));
    
    const results = [];
    
    // Process each SQS record
    for (const record of event.Records) {
      try {
        const messageBody = JSON.parse(record.body);
        console.log('Processing message:', messageBody);
        
        const result = await processGmbData(messageBody);
        results.push(result);
        
      } catch (error) {
        console.error('Error processing record:', error);
        results.push({
          success: false,
          error: error.message,
          record: record.body
        });
      }
    }
    
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
    reviews_dates
  } = data;
  
  console.log(`Processing GMB ID: ${gmb_id}`);
  
  try {
    const [
      isMoreThan3Categories,
      isNotRelevantCategories,
      isMoreThan5ServiceAreas,
      isMissingHoursWebDescription,
      isSuspiciousReviews,
      isPolicyViolations,
      isFakeAddress
    ] = await Promise.all([
      checkMoreThan3Categories(additional_categories),
      checkNotRelevantCategories(primary_category, additional_categories),
      checkMoreThan5ServiceAreas(service_areas),
      checkMissingHoursWebDescription(regular_hours, website_uri, description),
      checkSuspiciousReviews(reviews_dates),
      checkPolicyViolations(description),
      checkFakeAddress(address_lines, locality, administrative_area, postal_code, region_code)
    ]);
    
    const updateData = {
      is_more_than_3_categories: isMoreThan3Categories,
      is_not_relevant_categories: isNotRelevantCategories,
      is_more_than_5_service_areas: isMoreThan5ServiceAreas,
      is_missing_hours_web_description: isMissingHoursWebDescription,
      is_suspicious_reviews: isSuspiciousReviews,
      is_policy_violations: isPolicyViolations,
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
