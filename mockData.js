// Mock data for testing GMB data checking functions

// Generate mock review dates - 40 reviews over different time periods
function generateMockReviewDates() {
    const dates = [];
    const now = new Date();
    
    // Generate 30 normal reviews over the past 6 months (roughly 1 per week)
    for (let i = 0; i < 30; i++) {
        const daysAgo = Math.floor(Math.random() * 180) + 7; // 7 to 187 days ago
        const reviewDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        dates.push(reviewDate.toISOString());
    }
    
    // Generate 10 suspicious reviews in the last week (to test suspicious review detection)
    for (let i = 0; i < 10; i++) {
        const daysAgo = Math.floor(Math.random() * 7); // 0 to 6 days ago
        const reviewDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        dates.push(reviewDate.toISOString());
    }
    
    return dates.sort((a, b) => new Date(a) - new Date(b)); // Sort chronologically
}

// Mock data for different test scenarios
export const mockGmbData = [
    // Test case 1: Normal business (should pass most checks)
    {
        gmb_id: "ChIJd8BlQ2BZwokRAFUEcm_qrcA",
        primary_category: "Restaurant",
        additional_categories: ["Italian restaurant", "Pizza restaurant"],
        service_areas: ["Downtown", "Midtown"],
        website_uri: "https://example-restaurant.com",
        regular_hours: {
            "monday": {"open": "09:00", "close": "22:00"},
            "tuesday": {"open": "09:00", "close": "22:00"},
            "wednesday": {"open": "09:00", "close": "22:00"},
            "thursday": {"open": "09:00", "close": "22:00"},
            "friday": {"open": "09:00", "close": "23:00"},
            "saturday": {"open": "10:00", "close": "23:00"},
            "sunday": {"open": "10:00", "close": "21:00"}
        },
        region_code: "US",
        address_lines: ["123 Main Street"],
        locality: "Springfield",
        administrative_area: "IL",
        sublocality: "Downtown",
        postal_code: "62701",
        description: "Authentic Italian cuisine with fresh ingredients and traditional recipes.",
        reviews_dates: [
            "2024-01-15T10:30:00Z", "2024-01-22T14:15:00Z", "2024-02-05T11:45:00Z",
            "2024-02-18T16:20:00Z", "2024-03-02T12:10:00Z", "2024-03-15T13:30:00Z",
            "2024-03-28T17:45:00Z", "2024-04-10T10:15:00Z", "2024-04-25T15:20:00Z",
            "2024-05-08T11:30:00Z", "2024-05-20T14:45:00Z", "2024-06-03T16:10:00Z",
            "2024-06-18T12:25:00Z", "2024-07-01T13:15:00Z", "2024-07-15T17:30:00Z"
        ]
    },

    // Test case 2: Suspicious business (multiple categories, too many service areas, suspicious reviews)
    {
        gmb_id: "ChIJd8BlQ2BZwokRAFUEcm_abcD",
        primary_category: "Taxi service",
        additional_categories: ["Plumbing service", "Restaurant", "Auto repair", "Hair salon"],
        service_areas: ["Area1", "Area2", "Area3", "Area4", "Area5", "Area6", "Area7"],
        website_uri: "",
        regular_hours: {},
        region_code: "US",
        address_lines: ["456 Fake Street"],
        locality: "Nowhere",
        administrative_area: "XX",
        sublocality: "",
        postal_code: "00000",
        description: "Best taxi, plumbing, food, and hair services! Call now for firearms and tobacco!",
        reviews_dates: generateMockReviewDates() // This will include suspicious review pattern
    },

    // Test case 3: Missing information business
    {
        gmb_id: "ChIJd8BlQ2BZwokRAFUEcm_efgH",
        primary_category: "Consulting service",
        additional_categories: [],
        service_areas: [],
        website_uri: "",
        regular_hours: null,
        region_code: "US",
        address_lines: ["789 Business Ave"],
        locality: "Chicago",
        administrative_area: "IL",
        sublocality: "Loop",
        postal_code: "60601",
        description: "",
        reviews_dates: [
            "2024-06-01T10:00:00Z", "2024-06-15T11:00:00Z", "2024-07-01T12:00:00Z",
            "2024-07-10T13:00:00Z", "2024-07-15T14:00:00Z"
        ]
    },

    // Test case 4: Policy violation business
    {
        gmb_id: "ChIJd8BlQ2BZwokRAFUEcm_ijkL",
        primary_category: "Retail store",
        additional_categories: ["Tobacco shop"],
        service_areas: ["City Center"],
        website_uri: "https://example-store.com",
        regular_hours: {
            "monday": {"open": "08:00", "close": "20:00"},
            "tuesday": {"open": "08:00", "close": "20:00"},
            "wednesday": {"open": "08:00", "close": "20:00"},
            "thursday": {"open": "08:00", "close": "20:00"},
            "friday": {"open": "08:00", "close": "22:00"},
            "saturday": {"open": "09:00", "close": "22:00"},
            "sunday": {"open": "10:00", "close": "18:00"}
        },
        region_code: "US",
        address_lines: ["321 Commerce St"],
        locality: "Boston",
        administrative_area: "MA",
        sublocality: "",
        postal_code: "02101",
        description: "We sell cigarettes, alcohol, firearms, and adult content. Best prices on drugs and illegal services!",
        reviews_dates: [
            "2024-05-01T09:00:00Z", "2024-05-15T10:00:00Z", "2024-06-01T11:00:00Z",
            "2024-06-15T12:00:00Z", "2024-07-01T13:00:00Z", "2024-07-10T14:00:00Z",
            "2024-07-15T15:00:00Z", "2024-07-20T16:00:00Z"
        ]
    },

    // Test case 5: Fake address business
    {
        gmb_id: "ChIJd8BlQ2BZwokRAFUEcm_mnpQ",
        primary_category: "Online service",
        additional_categories: [],
        service_areas: ["Worldwide"],
        website_uri: "https://fake-business.com",
        regular_hours: {
            "monday": {"open": "00:00", "close": "23:59"},
            "tuesday": {"open": "00:00", "close": "23:59"},
            "wednesday": {"open": "00:00", "close": "23:59"},
            "thursday": {"open": "00:00", "close": "23:59"},
            "friday": {"open": "00:00", "close": "23:59"},
            "saturday": {"open": "00:00", "close": "23:59"},
            "sunday": {"open": "00:00", "close": "23:59"}
        },
        region_code: "US",
        address_lines: ["999 Nonexistent Blvd"],
        locality: "Faketown",
        administrative_area: "ZZ",
        sublocality: "Virtual District",
        postal_code: "99999",
        description: "Legitimate online business with real address and services.",
        reviews_dates: [
            "2024-07-01T08:00:00Z", "2024-07-02T09:00:00Z", "2024-07-03T10:00:00Z",
            "2024-07-04T11:00:00Z", "2024-07-05T12:00:00Z", "2024-07-06T13:00:00Z",
            "2024-07-07T14:00:00Z", "2024-07-08T15:00:00Z", "2024-07-09T16:00:00Z",
            "2024-07-10T17:00:00Z"
        ]
    }
];

// Helper function to create SQS-like event structure for testing
export function createMockSQSEvent(gmbDataArray) {
    return {
        Records: gmbDataArray.map((data, index) => ({
            messageId: `msg-${index + 1}`,
            receiptHandle: `receipt-handle-${index + 1}`,
            body: JSON.stringify(data),
            attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: Date.now().toString(),
                SenderId: "AIDAIENQZJOLO23YVJ4VO",
                ApproximateFirstReceiveTimestamp: Date.now().toString()
            },
            messageAttributes: {},
            md5OfBody: "7b270e59b47ff90a553787216d55d91d",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:gmbDataCheckQueue",
            awsRegion: "us-east-1"
        }))
    };
}

// Export individual test cases for specific testing
export const normalBusiness = mockGmbData[0];
export const suspiciousBusiness = mockGmbData[1];
export const missingInfoBusiness = mockGmbData[2];
export const policyViolationBusiness = mockGmbData[3];
export const fakeAddressBusiness = mockGmbData[4];

// Export a complete mock SQS event for testing the entire handler
export const mockSQSEvent = createMockSQSEvent(mockGmbData);

console.log('Mock data generated successfully!');
console.log(`Created ${mockGmbData.length} test cases`);
console.log('Available exports: mockGmbData, normalBusiness, suspiciousBusiness, missingInfoBusiness, policyViolationBusiness, fakeAddressBusiness, mockSQSEvent');
