import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase';

@Injectable()
export class OnboardingService {
  // Save onboarding progress
  async saveProgress(userId: string, progressData: any) {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: userId,
        ...progressData,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Save quiz responses
  async saveQuizResponse(userId: string, quizData: any) {
    const { data, error } = await supabase
      .from('quiz_responses')
      .insert({
        user_id: userId,
        ...quizData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Save user profile
  async saveProfile(userId: string, profileData: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...profileData,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Save symptom assessment
  async saveSymptoms(userId: string, symptoms: string[]) {
    const dependencyScore = Math.min(100, Math.floor(symptoms.length * 15 + Math.random() * 10));
    const severityScore = Math.min(100, symptoms.length * 12);

    const { data, error } = await supabase
      .from('symptom_assessments')
      .insert({
        user_id: userId,
        symptoms,
        dependency_score: dependencyScore,
        severity_score: severityScore,
        average_score: 40,
      })
      .select()
      .single();

    if (error) throw error;
    return { assessment: data, dependency_score: dependencyScore };
  }

  // Save user goals
  async saveGoals(userId: string, goalsData: any) {
    const { data, error } = await supabase
      .from('user_goals')
      .upsert({
        user_id: userId,
        ...goalsData,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Track subscription event
  async trackSubscriptionEvent(userId: string, eventData: any) {
    const { data, error } = await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        ...eventData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
