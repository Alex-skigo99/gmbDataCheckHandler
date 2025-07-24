import axios from "axios";
import Utils from "/opt/nodejs/utils.js";

export async function validateAddressWithValidationAPI(address) {
    try {
        const apiKey = await Utils.getGoogleMapsApiKey();
        
        const response = await axios.post('https://addressvalidation.googleapis.com/v1:validateAddress', {
            address: address
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                key: apiKey
            }
        });
        
        if (!response.data || !response.data.result) {
            console.error('Invalid response from Address Validation API');
            return { isValid: false, reason: 'Invalid API response' };
        }
        
        const result = response.data.result;
        const verdict = result.verdict || {};
        const address_data = result.address || {};
        
        const hasUnconfirmedComponents = verdict.hasUnconfirmedComponents === true;
        const addressComplete = verdict.addressComplete === true;
        const missingComponents = address_data.missingComponentTypes || [];
                
        return {
            isFake: hasUnconfirmedComponents,
            isComplete: missingComponents.length === 0,
            correctedAddress: address_data.formattedAddress || 'N/A',
            confidence: addressComplete,
            reason: verdict.reason || 'Validation completed'
        };
        
    } catch (error) {
        console.error('Address validation error:', error.response?.data || error.message);
        return { 
            isFake: null, 
            reason: `API error: ${error.message}`,
            error: error.response?.data || error.message
        };
    }
}
