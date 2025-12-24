//
//  TotalActivityView.swift
//  BlockServiceReport
//
//  Created by Emiliano San Roman on 2025-12-23.
//

import SwiftUI

struct TotalActivityView: View {
    let configuration: TotalActivityConfiguration
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.95).ignoresSafeArea()
            VStack(spacing: 24) {
                header
                summaryCard
                usageChart
                topAppsList
                shieldHint
            }
            .padding(.horizontal, 20)
            .padding(.top, 32)
            .padding(.bottom, 24)
        }
    }
    
    private var header: some View {
        VStack(spacing: 8) {
            Text("Screen Time")
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .foregroundColor(.white.opacity(0.7))
            Text(configuration.periodDescription.uppercased())
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundColor(.white.opacity(0.5))
        }
    }
    
    private var summaryCard: some View {
        VStack(spacing: 16) {
            Text(configuration.formattedTotalDuration)
                .font(.system(size: 48, weight: .semibold, design: .rounded))
                .foregroundColor(.white)
            HStack(spacing: 16) {
                StatPill(title: "Focus Score", value: "\(configuration.focusScore)%")
                StatPill(title: "Most Used", value: configuration.topApps.first?.name ?? "—")
                StatPill(title: "Apps Tracked", value: "\(configuration.topApps.count)")
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(colors: [.purple.opacity(0.7), .blue.opacity(0.7)],
                           startPoint: .topLeading,
                           endPoint: .bottomTrailing)
                .cornerRadius(24)
        )
    }
    
    private var usageChart: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Daily Focus")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                Spacer()
                Text("Last 24h")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.white.opacity(0.6))
            }
            GeometryReader { proxy in
                let maxValue = max(configuration.topApps.map(\.duration).max() ?? 1, 60)
                HStack(alignment: .bottom, spacing: 12) {
                    ForEach(configuration.topApps) { app in
                        VStack {
                            RoundedRectangle(cornerRadius: 6)
                                .fill(
                                    LinearGradient(colors: [.purple, .pink],
                                                   startPoint: .top,
                                                   endPoint: .bottom)
                                )
                                .frame(height: CGFloat(app.duration / maxValue) * max(proxy.size.height - 20, 0))
                            Text(app.name.prefix(3).uppercased())
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white.opacity(0.7))
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
            .frame(height: 140)
        }
    }
    
    private var topAppsList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Top Apps")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.white)
            ForEach(configuration.topApps) { app in
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(app.name)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                        Text(app.formattedDuration)
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.6))
                    }
                    Spacer()
                }
                .padding()
                .background(Color.white.opacity(0.05))
                .cornerRadius(16)
            }
        }
    }
    
    private var shieldHint: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Stay On Track")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white)
            Text("Use schedules or start a manual block to lower your total screen time. Long-press a focus mode in the main app to tweak the apps it shields.")
                .font(.system(size: 13))
                .foregroundColor(.white.opacity(0.7))
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
    }
}

private struct StatPill: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title.uppercased())
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(.white.opacity(0.6))
            Text(value)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.1))
        .cornerRadius(16)
    }
}

#Preview {
    let sample = TotalActivityConfiguration(
        generatedAt: Date(),
        periodDescription: "Last 24 Hours",
        totalDuration: 13_000,
        topApps: [
            .init(id: "instagram", name: "Instagram", duration: 4_800),
            .init(id: "xcom", name: "X", duration: 3_600),
            .init(id: "opal", name: "Opal", duration: 2_400),
            .init(id: "mail", name: "Mail", duration: 1_200),
            .init(id: "safari", name: "Safari", duration: 900)
        ]
    )
    TotalActivityView(configuration: sample)
}
