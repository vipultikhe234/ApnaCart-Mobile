import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { fcmService } from './api';

/**
 * Initialize Firebase messaging and handle token lifecycle.
 */
export const initializeFirebase = async () => {
    // Return early if not on a native device
    if (Capacitor.getPlatform() === 'web') {
        console.log('FCM: Web platform detected. Native messaging skipped.');
        return;
    }

    try {
        console.log('FCM: Initializing Firebase Messaging...');

        // 1. Request permissions for push notifications
        const result = await FirebaseMessaging.requestPermissions();
        
        if (result.receive === 'granted') {
            // 2. Register for push notifications
            await FirebaseMessaging.register();
            
            // 3. Get initial token
            const tokenResult = await FirebaseMessaging.getToken();
            console.log('FCM: Token Retrieved:', tokenResult.token);
            
            // 4. Send token to backend if logged in
            if (localStorage.getItem('access_token')) {
                await syncFCMToken(tokenResult.token);
            }
        } else {
            console.warn('FCM: Push permission denied.');
        }

        // --- Setup Listeners ---

        // Handle case where token is refreshed by FCM internally
        await FirebaseMessaging.addListener('tokenReceived', async (event) => {
            console.log('FCM: Token Refreshed:', event.token);
            if (localStorage.getItem('access_token')) {
                await syncFCMToken(event.token);
            }
        });

        // Handle notification clicks or background data
        await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
            console.log('FCM: Notification action clicked:', event.notification);
            handleDataMessage(event.notification.data);
        });

        // Background Message Handler (Silent notifications)
        // Note: Capacitor Messaging handles this via the same listener or a separate one depending on OS
        // For general live updates, we'll extract the logic to a helper
        const handleDataMessage = (data) => {
            if (!data) return;
            const { type, id } = data;

            console.log(`FCM: Received data message of type: ${type}`);

            switch (type) {
                case 'order':
                    if (id) window.location.href = `/order/${id}`;
                    break;
                case 'refresh_products':
                    import('./api').then(m => m.bustCache('/products'));
                    console.log('FCM: Busting products cache for live update');
                    break;
                case 'refresh_categories':
                    import('./api').then(m => m.bustCache('/categories'));
                    console.log('FCM: Busting categories cache for live update');
                    break;
                case 'refresh_coupons':
                    import('./api').then(m => m.bustCache('/coupons'));
                    console.log('FCM: Busting coupons cache for live update');
                    break;
                default:
                    console.log('FCM: Unhandled data type:', type);
            }
        };

        // Also listen for foreground data messages
        await FirebaseMessaging.addListener('notificationReceived', (event) => {
            console.log('FCM: Notification received in foreground:', event.notification);
            if (event.notification.data) {
                handleDataMessage(event.notification.data);
            }
        });

        // Initialize Analytics
        try {
            await FirebaseAnalytics.setCollectionEnabled({ enabled: true });
        } catch (analyticsError) {
            console.warn('FCM: Analytics failed to start', analyticsError);
        }
        
    } catch (error) {
        console.error('FCM: Initialization Error:', error);
    }
};

/**
 * Send the FCM token to the backend API.
 * 
 * @param {string} token 
 */
export const syncFCMToken = async (token) => {
    try {
        const response = await fcmService.saveToken(token);
        console.log('FCM: Token synced with backend.', response.data);
    } catch (error) {
        console.error('FCM: Token sync failed.', error);
    }
};

/**
 * Remove the FCM token from the backend (usually on logout).
 */
export const removeFCMToken = async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
        await fcmService.removeToken();
        console.log('FCM: Token removed from backend.');
    } catch (error) {
        console.error('FCM: Token removal failed.', error);
    }
};

/**
 * Get the current FCM token without full initialization/sync.
 * Useful for attaching to login/register requests.
 */
export const getFCMToken = async () => {
    if (Capacitor.getPlatform() === 'web') return null;

    try {
        const result = await FirebaseMessaging.checkPermissions();
        if (result.receive === 'granted') {
            const tokenResult = await FirebaseMessaging.getToken();
            return tokenResult.token;
        }
    } catch (e) {
        console.warn('FCM: Failed to get token pre-emptively', e);
    }
    return null;
};

/**
 * Log analytics event.
 */
export const logEvent = async (name, params = {}) => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
        await FirebaseAnalytics.logEvent({ name, params });
    } catch (e) {
        // Silently fail for analytics
    }
};
