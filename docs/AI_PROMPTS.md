# AI Prompts & LLM Configuration - Aramco Reviews Enterprise

## Overview

This document contains all LLM prompt templates and best practices for AI integration in the Aramco Reviews platform.

## 1. Sentiment Analysis Prompt

### Input
```json
{
  "review_text": "The washroom is dirty and poorly maintained.",
  "language": "en",
  "context": {
    "station": "Karachi Port Terminal",
    "rating": 2,
    "category": "washroom"
  }
}
```

### Prompt Template
```
Analyze the sentiment of the following customer review for a service station.

Review: "{review_text}"
Station: {station}
Category: {category}
Star Rating: {rating}/5

Provide:
1. Overall sentiment (positive, neutral, or negative)
2. Confidence score (0.0 - 1.0)
3. Key emotional indicators
4. Suggested action category

Format your response as JSON.
```

### Expected Output
```json
{
  "sentiment": "negative",
  "confidence": 0.95,
  "emotional_indicators": ["disappointed", "frustrated", "unsatisfied"],
  "action_category": "cleanliness",
  "recommendation": "Schedule immediate washroom deep cleaning and inspection"
}
```

## 2. Station Summary Prompt

### Input
```json
{
  "station_name": "Karachi Port Terminal",
  "period": "2025-11-01 to 2025-11-30",
  "metrics": {
    "total_reviews": 42,
    "avg_rating": 3.8,
    "negative_count": 6,
    "positive_count": 28,
    "neutral_count": 8
  },
  "top_complaints": [
    {
      "complaint": "dirty washroom",
      "frequency": 5
    },
    {
      "complaint": "long queue",
      "frequency": 3
    }
  ],
  "top_praises": [
    {
      "praise": "friendly staff",
      "frequency": 12
    },
    {
      "praise": "quick service",
      "frequency": 10
    }
  ],
  "representative_reviews": [
    {
      "rating": 2,
      "text": "Washroom is unhygienic and needs immediate attention."
    },
    {
      "rating": 5,
      "text": "Staff was helpful and professional. Very satisfied."
    },
    {
      "rating": 3,
      "text": "Service was okay but waiting time was long."
    }
  ]
}
```

### Prompt Template
```
You are a customer feedback analyst for a service station company. 
Generate a professional, concise summary based on the following data.

Station: {station_name}
Period: {period}
Total Reviews: {total_reviews}
Average Rating: {avg_rating}/5

Key Metrics:
- Positive Reviews: {positive_count} ({positive_pct}%)
- Negative Reviews: {negative_count} ({negative_pct}%)
- Neutral Reviews: {neutral_count} ({neutral_pct}%)

Top Complaints:
{top_complaints_list}

Top Praises:
{top_praises_list}

Sample Reviews:
{sample_reviews}

Provide a professional summary (max 100 words) including:
1. Overall station performance assessment
2. Main areas of concern
3. Strengths to maintain
4. Top 3 priority action items for the station manager

Format output as:
SUMMARY:
[summary text]

PRIORITY ACTIONS:
1. [action]
2. [action]
3. [action]
```

### Expected Output
```
SUMMARY:
Karachi Port Terminal shows positive overall performance (3.8/5 average rating) with 
majority satisfaction (67% positive reviews). Main concern is facility cleanliness, 
particularly washroom hygiene. Staff performance is consistently praised for friendliness 
and efficiency. Queue management during peak hours remains a secondary concern. Immediate 
focus should be on cleaning protocols while maintaining current service quality standards.

PRIORITY ACTIONS:
1. Implement daily deep-cleaning schedule for washrooms with supervisor inspection
2. Increase staff during peak hours to reduce queue times
3. Install real-time feedback system for immediate cleanliness reporting
```

## 3. Keyword Extraction Prompt

### Input
```json
{
  "text": "The fuel quality is poor, often have water in it. Staff was rude and unhelpful.",
  "language": "en"
}
```

### Prompt Template
```
Extract key topics and issues from the following customer review.

Review: "{text}"

Identify:
1. Main issues/complaints (if any)
2. Service aspects mentioned
3. Emotional tone indicators
4. Critical/urgent flags

Return as JSON with arrays.
```

### Expected Output
```json
{
  "issues": ["fuel quality", "water contamination"],
  "services_mentioned": ["fuel", "staff", "customer_service"],
  "tone_indicators": ["poor", "rude", "unhelpful"],
  "critical_flags": ["fuel quality issue", "staff behavior"],
  "severity": "high"
}
```

## 4. Review Classification Prompt

### Input
```json
{
  "review_text": "Great service, staff was helpful",
  "rating": 5
}
```

### Prompt Template
```
Classify the following review into one or more categories:

Available Categories:
- Washroom/Hygiene
- Staff/Customer Service
- Fuel Quality
- Store/Shop
- Car Wash Service
- Safety/Security
- Parking
- Overall Experience

Review: "{review_text}"
Rating: {rating}/5

Return JSON with:
{
  "primary_category": "string",
  "secondary_categories": ["string"],
  "confidence": number (0-1),
  "reasoning": "string"
}
```

### Expected Output
```json
{
  "primary_category": "Staff/Customer Service",
  "secondary_categories": ["Overall Experience"],
  "confidence": 0.95,
  "reasoning": "Review explicitly mentions 'helpful' staff, indicating service quality focus"
}
```

## 5. Spam/Fake Review Detection Prompt

### Input
```json
{
  "text": "Amazing amazing amazing!!!!! Best service ever!!!",
  "user_email": "test123@tempmail.com",
  "device_fingerprint": "abc123",
  "multiple_reviews_same_day": 5,
  "geo_distance_km": 5000
}
```

### Prompt Template
```
Analyze the following review submission for potential spam/fake indicators.

Review Text: "{text}"
Device: {device_fingerprint}
User Email: {user_email}
Reviews from device today: {multiple_reviews_same_day}
Geo Distance from Station: {geo_distance_km}km

Red Flags to Check:
1. Excessive punctuation or caps
2. Generic praise with no specifics
3. Unusual submission patterns
4. Geographic inconsistencies
5. Suspicious email domain
6. Device fingerprint anomalies

Return JSON with:
{
  "is_likely_spam": boolean,
  "spam_score": number (0-1),
  "red_flags": [string],
  "recommendation": "approve|review|reject"
}
```

### Expected Output
```json
{
  "is_likely_spam": true,
  "spam_score": 0.87,
  "red_flags": [
    "excessive_punctuation",
    "generic_praise_no_specifics",
    "temp_email_domain",
    "geographic_mismatch"
  ],
  "recommendation": "reject"
}
```

## 6. Translation Prompt (Urdu to English)

### Input
```json
{
  "text": "واشروم بہت گندا ہے، صفائی نہیں ہے",
  "source_language": "ur",
  "target_language": "en"
}
```

### Prompt Template
```
Translate the following customer review from {source_language} to {target_language}.
Preserve the meaning and emotional tone. If there are colloquialisms, translate the 
intent rather than literal meaning.

Original Text: "{text}"

Provide:
1. Direct translation
2. Semantic translation (intent-based)
3. Detected emotion/tone
4. Any cultural context needed

Format as JSON.
```

### Expected Output
```json
{
  "direct_translation": "Washroom is very dirty, not clean",
  "semantic_translation": "The washroom is extremely filthy and poorly maintained",
  "tone": "frustrated, disappointed",
  "cultural_context": "Strong emphasis on cleanliness in customer expectations"
}
```

## 7. Action Items Generation Prompt

### Input
```json
{
  "station_name": "Lahore Main Terminal",
  "avg_rating": 3.2,
  "top_complaints": ["long wait times", "staff attitude", "cleanliness"],
  "recent_negative_reviews": 15,
  "previous_actions_taken": [
    "Hired 2 additional staff members",
    "Implemented new cleaning schedule"
  ]
}
```

### Prompt Template
```
Generate actionable recommendations for a service station manager based on customer feedback.

Station: {station_name}
Current Rating: {avg_rating}/5
Recent Negative Reviews: {recent_negative_reviews}
Top Complaints: {top_complaints_list}

Previous Actions:
{previous_actions}

Provide specific, measurable, actionable recommendations that:
1. Address top complaints directly
2. Are achievable within 30 days
3. Build on previous efforts
4. Consider cost-effectiveness
5. Include success metrics

Format as JSON with priority levels.
```

### Expected Output
```json
{
  "recommendations": [
    {
      "priority": "high",
      "action": "Implement staff courtesy training program",
      "description": "Conduct mandatory 2-hour training for all staff on customer service excellence",
      "timeline": "7 days",
      "budget_estimate": "PKR 5000",
      "success_metric": "Reduce staff-related complaints by 50% within 30 days"
    },
    {
      "priority": "high",
      "action": "Extend operating hours of payment counters",
      "description": "Open additional payment counter during peak hours (11am-2pm, 5pm-7pm)",
      "timeline": "3 days",
      "budget_estimate": "PKR 2000/day",
      "success_metric": "Reduce average wait time below 5 minutes"
    },
    {
      "priority": "medium",
      "action": "Install real-time cleanliness checklist system",
      "description": "Create digital checklist for hourly cleanliness inspections with photo verification",
      "timeline": "14 days",
      "budget_estimate": "PKR 15000",
      "success_metric": "Achieve 95% compliance with cleaning standards"
    }
  ]
}
```

## 8. Spike Detection Prompt

### Input
```json
{
  "station": "Karachi Port Terminal",
  "daily_reviews": [
    {"date": "2025-11-23", "negative_count": 2, "total": 12},
    {"date": "2025-11-24", "negative_count": 3, "total": 14},
    {"date": "2025-11-25", "negative_count": 12, "total": 15}
  ],
  "normal_negative_rate": 0.15
}
```

### Prompt Template
```
Analyze customer feedback trends for anomalies indicating a service crisis.

Station: {station}
Recent Daily Data:
{daily_data}

Normal Negative Review Rate: {normal_rate}%
Current Rate (last day): {current_rate}%

Analyze for:
1. Spike percentage vs. baseline
2. Potential root cause based on review content
3. Urgency level
4. Recommended immediate actions

If spike is detected (>30% above baseline), provide crisis assessment.
```

### Expected Output
```json
{
  "spike_detected": true,
  "spike_percentage": 320,
  "baseline_rate": 0.15,
  "current_rate": 0.80,
  "urgency": "critical",
  "potential_causes": [
    "Staff shortage or incident",
    "Quality control failure",
    "Infrastructure issue"
  ],
  "immediate_actions": [
    "Station manager notification (done)",
    "Request incident report from station",
    "Deploy audit team for inspection",
    "Public response preparation"
  ]
}
```

## 9. Cost Optimization

### Rate Limiting Strategy

```javascript
// Batch reviews for summarization
// Only call LLM during nightly batch (11 PM)

// Skip LLM if:
if (sentiment === 'neutral' && !hasKeywords && rating >= 3) {
  // Use rule-based summary
  summary = generateRuleBasedSummary(review);
} else {
  // Call LLM
  summary = await callOpenAI(reviewData);
}

// Cache summaries for 30 days
redis.setex(`summary:${stationId}:${month}`, 2592000, cachedSummary);
```

### Budget Monitoring

```javascript
// Track LLM costs
const trackLLMCost = (model, tokens) => {
  const costPerToken = {
    'gpt-3.5-turbo': 0.0000015,
    'gpt-4': 0.00003,
  };
  const cost = tokens * costPerToken[model];
  
  // Alert if monthly cost exceeds budget
  if (monthlySpend > 5000) {
    sendAlert('LLM costs exceeding budget');
  }
};
```

## 10. Model Selection Guide

| Use Case | Model | Reason | Cost |
|----------|-------|--------|------|
| Sentiment Analysis | Hosted API (fast model) | Speed < 1s | Low |
| Summarization | GPT-3.5-turbo | Quality/cost balance | $$ |
| Complex Reasoning | GPT-4 / Claude | Better logic | $$$ |
| Translation | Google Translate API | Specialized | $ |
| Keyword Extraction | Rule-based + regex | Fast, reliable | $ |

## 11. Error Handling

```javascript
// Graceful degradation if LLM unavailable
try {
  summary = await callLLM(review);
} catch (error) {
  if (error.rateLimitExceeded) {
    // Use cached version
    summary = getCachedSummary(stationId);
  } else if (error.serviceUnavailable) {
    // Use rule-based fallback
    summary = generateRuleBasedSummary(review);
  } else {
    // Log and rethrow
    logger.error('LLM error:', error);
    throw error;
  }
}
```

## 12. Monitoring LLM Performance

```javascript
// Track metrics
metrics = {
  avgLatency: 1.2, // seconds
  costPerReview: 0.0045, // dollars
  errorRate: 0.02, // 2%
  qualityScore: 0.87, // 0-1 scale
};

// Alert thresholds
if (metrics.errorRate > 0.05) {
  alert('LLM error rate > 5%');
}
if (metrics.avgLatency > 5) {
  alert('LLM latency degraded');
}
```

## 13. Privacy & Compliance

- **PII Removal:** Sanitize personal data before LLM calls
- **Logging:** Don't log raw review text sent to external LLMs
- **Retention:** Delete cached LLM responses after 30 days
- **Audit:** Log all LLM API calls for compliance

---

**Last Updated:** 2025-11-25
**Version:** 1.0.0
