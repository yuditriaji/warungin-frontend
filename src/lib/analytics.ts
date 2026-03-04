// GA4 Analytics Helper — Warungin Frontend App
// Docs: https://developers.google.com/analytics/devguides/collection/ga4/events

declare global {
    interface Window {
        gtag: (...args: unknown[]) => void;
        dataLayer: unknown[];
    }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

/**
 * Track a custom GA4 event.
 * All events from the dashboard app include `app_section: 'dashboard'`
 * so they can be filtered separately from landing page events in GA4.
 */
export function trackEvent(
    eventName: string,
    params?: Record<string, unknown>
): void {
    if (typeof window === 'undefined' || !window.gtag) return;
    if (!GA_MEASUREMENT_ID) return;

    window.gtag('event', eventName, {
        app_section: 'dashboard',
        ...params,
    });
}

/**
 * Track a page view manually (useful for SPA route changes).
 */
export function trackPageView(url: string): void {
    if (typeof window === 'undefined' || !window.gtag) return;
    if (!GA_MEASUREMENT_ID) return;

    window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
        app_section: 'dashboard',
    });
}

// ------------------------------------------------------------------
// Typed event helpers — add more as needed
// ------------------------------------------------------------------

/** User successfully logged in */
export const trackLogin = (method: 'google' | 'email' = 'google') =>
    trackEvent('login', { method });

/** User completed onboarding form */
export const trackOnboardingComplete = (businessType: string) =>
    trackEvent('onboarding_complete', { business_type: businessType });

/** User visited a key feature page */
export type FeatureName =
    | 'dashboard'
    | 'inventory'
    | 'pos'
    | 'reports'
    | 'customers'
    | 'staff'
    | 'settings';

export const trackFeatureUsed = (feature: FeatureName) =>
    trackEvent('feature_used', { feature });

/** User clicked the upgrade/subscribe button */
export const trackSubscriptionUpgrade = (plan: string) =>
    trackEvent('subscription_upgrade', { plan });
