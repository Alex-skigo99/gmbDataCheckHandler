import { OpenAI } from "openai";
import { getGoogleAutocompleteAddressResponse } from "./googleMapsUtils.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateResponse(prompt) {
    const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
    });
    return response;
}

export async function generateResponseVision(prompt, imageUrl) {
    const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [{
            role: "user",
            content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageUrl } },
            ],
        }],
        temperature: 0.2,
    });
    return response;
}

export function checkMoreThan3Categories(additionalCategories) {
    try {
        const additionalCategoriesArray = Array.isArray(additionalCategories) 
            ? additionalCategories 
            : JSON.parse(additionalCategories || '[]');
        
        const totalCategories = 1 + additionalCategoriesArray.length; // 1 for primary + additional
        return totalCategories > 3;
    } catch (error) {
        console.error('Error checking categories count:', error);
        return null;
    }
}

export async function checkNotRelevantCategories(primaryCategory, additionalCategories) {
    try {
        const additionalCategoriesArray = Array.isArray(additionalCategories) 
            ? additionalCategories 
            : JSON.parse(additionalCategories || '[]');
        
        if (additionalCategoriesArray.length === 0) {
            return false; // Can't be irrelevant if there's only one category
        }

        const allCategories = [primaryCategory, ...additionalCategoriesArray];
        const categoriesText = allCategories.join(', ');
        
        const prompt = `Analyze the following business categories and determine if they are relevant to each other for a single business: ${categoriesText}

Categories are considered NOT RELEVANT if they represent completely different business types that would be unusual or impossible for one business to operate (e.g., taxi company and plumber, restaurant and auto repair).

Respond with only "true" if the categories are NOT RELEVANT to each other, or "false" if they are relevant or could reasonably belong to the same business.`;

        const response = await generateResponse(prompt);
        const result = response.choices[0].message.content.trim().toLowerCase();
        return result.includes('true');
    } catch (error) {
        console.error('Error checking category relevance:', error);
        return null; // Return null to indicate error
    }
}

export function checkMoreThan5ServiceAreas(serviceAreas) {
    try {
        const serviceAreasArray = Array.isArray(serviceAreas) 
            ? serviceAreas 
            : JSON.parse(serviceAreas || '[]');
        
        return serviceAreasArray.length > 5;
    } catch (error) {
        console.error('Error checking service areas count:', error);
        return null;
    }
}

export function checkMissingHoursWebDescription(regularHours, websiteUri, description = '') {
    try {
        const hoursData = typeof regularHours === 'string' 
            ? JSON.parse(regularHours || '{}') 
            : regularHours || {};
        
        const hasMissingHours = !hoursData || Object.keys(hoursData).length === 0;
        const hasMissingWebsite = !websiteUri || websiteUri.trim() === '';
        const hasMissingDescription = !description || description.trim() === '';
        
        return hasMissingHours || hasMissingWebsite || hasMissingDescription;
    } catch (error) {
        console.error('Error checking missing hours/web/description:', error);
        return null;
    }
}

export function checkSuspiciousReviews(reviewsDates) {
    try {
        const datesArray = Array.isArray(reviewsDates) 
            ? reviewsDates 
            : JSON.parse(reviewsDates || '[]');
        
        if (datesArray.length < 10) {
            return false; // Not enough data
        }

        const sortedDates = datesArray.map(date => new Date(date)).sort((a, b) => a - b);
        const now = new Date();
        const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
                        
        const last3MonthsReviews = sortedDates.filter(date => date >= threeMonthsAgo);
        
        const weeklyReviewCounts = [];
        const currentWeekStart = new Date(threeMonthsAgo);
        
        while (currentWeekStart < now) {
            const weekEnd = new Date(currentWeekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
            const reviewsInWeek = last3MonthsReviews.filter(date => 
                date >= currentWeekStart && date < weekEnd
            ).length;
            
            weeklyReviewCounts.push(reviewsInWeek);
            currentWeekStart.setTime(weekEnd.getTime());
        }
                
        const maxWeeklyCount = Math.max(...weeklyReviewCounts);
        const maxWeekIndex = weeklyReviewCounts.indexOf(maxWeeklyCount);
        const otherWeeksCounts = weeklyReviewCounts.filter((_, index) => index !== maxWeekIndex);
        const otherWeeksAverage = otherWeeksCounts.length > 0 
            ? otherWeeksCounts.reduce((sum, count) => sum + count, 0) / otherWeeksCounts.length 
            : 0;
        
        const isSuspicious = maxWeeklyCount > (otherWeeksAverage * 3) && maxWeeklyCount > 10;

        console.log(`Review analysis - Max weekly: ${maxWeeklyCount}, Other weeks avg: ${otherWeeksAverage.toFixed(2)}, Suspicious: ${isSuspicious}`);

        return isSuspicious;
    } catch (error) {
        console.error('Error checking suspicious reviews:', error);
        return null;
    }
}

export async function checkPolicyViolations(description) {
    if (!description || description.trim() === '') {
        return false;
    }
    try {      
        const contentToCheck = `Description: ${description}`.trim();
        
        const prompt = `Analyze the following business information for Google My Business policy violations. Look for content that includes prohibited items such as:
- Regulated products (alcohol, firearms, drugs, tobacco)
- Adult content
- Illegal services
- Misleading or deceptive content
- Spam or irrelevant content

Business Information:
${contentToCheck}

Respond with only "true" if there are potential policy violations, or "false" if the content appears compliant.`;

        const response = await generateResponse(prompt);
        const result = response.choices[0].message.content.trim().toLowerCase();
        return result.includes('true');
    } catch (error) {
        console.error('Error checking policy violations:', error);
        return false;
    }
}

export async function checkFakeAddress(addressLines, locality, administrativeArea, postalCode, regionCode) {
    try {
        const fullAddress = [
            Array.isArray(addressLines) ? addressLines.join(' ') : addressLines,
            locality,
            administrativeArea,
            postalCode,
            regionCode
        ].filter(Boolean).join(',');
        
        if (!fullAddress.trim()) {
            return null;
        }
        
        const response = await getGoogleAutocompleteAddressResponse(fullAddress);
        
        if (!response || !response.data) {
            console.error('Google Autocomplete API request failed');
            return null; // Assume real if API fails
        }
        
        const results = response.data.predictions || [];
        
        if (!Array.isArray(results) || results.length === 0) {
            return true;
        }
        
        const hasValidMatch = results.some(result => {
            const resultAddress = result.description.toLowerCase();
            const inputAddressLower = fullAddress.toLowerCase();
            
            const addressParts = inputAddressLower.split(',').map(part => part.trim());
            return addressParts.some(part => 
                part.length > 2 && resultAddress.includes(part)
            );
        });
        
        return !hasValidMatch;
    } catch (error) {
        console.error('Error checking fake address:', error);
        return null;
    }
}
