import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const ensureUserId = (req: AuthRequest, res: Response): string | null => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return null;
  }

  return userId;
};

// =====================================================
// ONBOARDING PROGRESS
// =====================================================

// Get user's onboarding progress
router.get('/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ progress: data || null });
  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding progress' });
  }
});

// Update onboarding progress
router.post('/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { current_screen, completed_screens, is_completed } = req.body;

    const { data, error } = await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: userId,
        current_screen,
        completed_screens,
        is_completed,
        completed_at: is_completed ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ progress: data });
  } catch (error) {
    console.error('Error updating onboarding progress:', error);
    res.status(500).json({ error: 'Failed to update onboarding progress' });
  }
});

// =====================================================
// QUIZ RESPONSES
// =====================================================

// Submit quiz response
router.post('/quiz/response', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { quiz_type, question_id, question_text, answer_value, answer_data } = req.body;

    const { data, error } = await supabase
      .from('quiz_responses')
      .insert({
        user_id: userId,
        quiz_type,
        question_id,
        question_text,
        answer_value,
        answer_data,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ response: data });
  } catch (error) {
    console.error('Error submitting quiz response:', error);
    res.status(500).json({ error: 'Failed to submit quiz response' });
  }
});

// Get all quiz responses for user
router.get('/quiz/responses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { quiz_type } = req.query;

    let query = supabase
      .from('quiz_responses')
      .select('*')
      .eq('user_id', userId)
      .order('answered_at', { ascending: true });

    if (quiz_type) {
      query = query.eq('quiz_type', quiz_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ responses: data });
  } catch (error) {
    console.error('Error fetching quiz responses:', error);
    res.status(500).json({ error: 'Failed to fetch quiz responses' });
  }
});

// =====================================================
// USER PROFILE
// =====================================================

// Get user profile
router.get('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ profile: data || null });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.post('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const {
      first_name,
      age,
      gender,
      orientation,
      ethnicity,
      religion,
      region,
      show_religious_content,
    } = req.body;

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        first_name,
        age,
        gender,
        orientation,
        ethnicity,
        religion,
        region,
        show_religious_content,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ profile: data });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// =====================================================
// SYMPTOM ASSESSMENT
// =====================================================

// Submit symptom assessment
router.post('/symptoms', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { symptoms } = req.body;

    // Calculate dependency score (simple algorithm for now)
    const severity_score = Math.min(100, symptoms.length * 12);
    const dependency_score = Math.min(100, Math.floor(symptoms.length * 15 + Math.random() * 10));
    const average_score = 40; // This would come from actual average calculation

    const { data, error } = await supabase
      .from('symptom_assessments')
      .insert({
        user_id: userId,
        symptoms,
        severity_score,
        dependency_score,
        average_score,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      assessment: data,
      scores: {
        dependency: dependency_score,
        average: average_score,
        severity: severity_score,
      },
    });
  } catch (error) {
    console.error('Error submitting symptom assessment:', error);
    res.status(500).json({ error: 'Failed to submit symptom assessment' });
  }
});

// Get latest symptom assessment
router.get('/symptoms', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { data, error } = await supabase
      .from('symptom_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ assessment: data || null });
  } catch (error) {
    console.error('Error fetching symptom assessment:', error);
    res.status(500).json({ error: 'Failed to fetch symptom assessment' });
  }
});

// =====================================================
// GOALS & COMMITMENT
// =====================================================

// Submit user goals
router.post('/goals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { goals, quit_date, commitment_signature } = req.body;

    const { data, error } = await supabase
      .from('user_goals')
      .upsert({
        user_id: userId,
        goals,
        quit_date,
        commitment_signature,
        commitment_signed_at: commitment_signature ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ goals: data });
  } catch (error) {
    console.error('Error submitting user goals:', error);
    res.status(500).json({ error: 'Failed to submit user goals' });
  }
});

// Get user goals
router.get('/goals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ goals: data || null });
  } catch (error) {
    console.error('Error fetching user goals:', error);
    res.status(500).json({ error: 'Failed to fetch user goals' });
  }
});

// =====================================================
// REFERRAL SOURCE
// =====================================================

// Submit referral source
router.post('/referral', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { source, referral_code } = req.body;

    const { data, error } = await supabase
      .from('referral_sources')
      .upsert({
        user_id: userId,
        source,
        referral_code,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ referral: data });
  } catch (error) {
    console.error('Error submitting referral source:', error);
    res.status(500).json({ error: 'Failed to submit referral source' });
  }
});

// =====================================================
// APP RATING
// =====================================================

// Submit app rating
router.post('/rating', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { rating, review_text, platform } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const { data, error } = await supabase
      .from('app_ratings')
      .insert({
        user_id: userId,
        rating,
        review_text,
        platform,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ rating: data });
  } catch (error) {
    console.error('Error submitting app rating:', error);
    res.status(500).json({ error: 'Failed to submit app rating' });
  }
});

// =====================================================
// CUSTOM PLAN
// =====================================================

// Generate custom plan
router.post('/plan', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { goals, symptoms } = req.body;

    // Calculate quit date (90 days from now)
    const quit_date = new Date();
    quit_date.setDate(quit_date.getDate() + 90);

    // Determine plan type based on symptoms
    let plan_type = 'beginner';
    if (symptoms && symptoms.length > 5) {
      plan_type = 'advanced';
    } else if (symptoms && symptoms.length > 3) {
      plan_type = 'intermediate';
    }

    // Default benefits
    const benefits = [
      { id: 'energy', label: 'Increased Energy', icon: '💪', color: '#00a86b' },
      { id: 'focus', label: 'Improved Focus', icon: '🎯', color: '#0077be' },
      { id: 'relationships', label: 'Better Relationships', icon: '❤️', color: '#dc143c' },
      { id: 'confidence', label: 'Increased Confidence', icon: '😊', color: '#9370db' },
      { id: 'motivation', label: 'Increased Motivation', icon: '🔥', color: '#ff1493' },
      { id: 'productivity', label: 'Better Productivity', icon: '⚡', color: '#9370db' },
    ];

    // Default daily habits
    const daily_habits = [
      { id: 'filter', title: "Use Unscroller's content blocking filter", icon: '🛡️' },
      { id: 'panic', title: 'Press the Panic Button when feeling tempted', icon: '🚨' },
      { id: 'pledge', title: 'Pledge daily to stay focused', icon: '🤝' },
    ];

    const { data, error } = await supabase
      .from('custom_plans')
      .upsert({
        user_id: userId,
        plan_type,
        quit_date: quit_date.toISOString().split('T')[0],
        goals,
        benefits,
        daily_habits,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ plan: data });
  } catch (error) {
    console.error('Error generating custom plan:', error);
    res.status(500).json({ error: 'Failed to generate custom plan' });
  }
});

// Get custom plan
router.get('/plan', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { data, error } = await supabase
      .from('custom_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ plan: data || null });
  } catch (error) {
    console.error('Error fetching custom plan:', error);
    res.status(500).json({ error: 'Failed to fetch custom plan' });
  }
});

// =====================================================
// SUBSCRIPTION EVENTS
// =====================================================

// Track subscription event
router.post('/subscription/event', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const {
      event_type,
      plan_type,
      plan_price_cents,
      discount_percentage,
      offer_type,
      payment_platform,
      transaction_id,
      event_metadata,
    } = req.body;

    const { data, error } = await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type,
        plan_type,
        plan_price_cents,
        discount_percentage,
        offer_type,
        payment_platform,
        transaction_id,
        event_metadata,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ event: data });
  } catch (error) {
    console.error('Error tracking subscription event:', error);
    res.status(500).json({ error: 'Failed to track subscription event' });
  }
});

// =====================================================
// ANALYTICS
// =====================================================

// Track screen view
router.post('/analytics/screen', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { screen_name, time_spent_seconds, interactions, dropped_off, completed } = req.body;

    const { data, error } = await supabase
      .from('onboarding_analytics')
      .insert({
        user_id: userId,
        screen_name,
        time_spent_seconds,
        interactions,
        dropped_off,
        completed,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ analytics: data });
  } catch (error) {
    console.error('Error tracking screen analytics:', error);
    res.status(500).json({ error: 'Failed to track screen analytics' });
  }
});

// Get onboarding analytics summary
router.get('/analytics/summary', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const { data, error } = await supabase
      .from('onboarding_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: true });

    if (error) throw error;

    // Calculate summary metrics
    const summary = {
      total_screens_viewed: data.length,
      total_time_spent: data.reduce((sum, item) => sum + (item.time_spent_seconds || 0), 0),
      completion_rate: data.filter(item => item.completed).length / Math.max(data.length, 1),
      drop_off_rate: data.filter(item => item.dropped_off).length / Math.max(data.length, 1),
      screens: data,
    };

    res.json({ summary });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

export default router;
