//
//  TotalActivityReport.swift
//  BlockServiceReport
//
//  Created by Emiliano San Roman on 2025-12-23.
//

import DeviceActivity
import ExtensionKit
import SwiftUI

extension DeviceActivityReport.Context {
    static let totalActivity = Self("Total Activity")
}

struct TotalActivityConfiguration: Equatable {
    struct AppSummary: Identifiable, Equatable {
        let id: String
        let name: String
        let duration: TimeInterval
        
        var formattedDuration: String {
            TotalActivityConfiguration.durationFormatter.string(from: duration) ?? "--"
        }
    }
    
    static let durationFormatter: DateComponentsFormatter = {
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = [.hour, .minute]
        formatter.unitsStyle = .abbreviated
        formatter.zeroFormattingBehavior = .dropAll
        return formatter
    }()
    
    let generatedAt: Date
    let periodDescription: String
    let totalDuration: TimeInterval
    let topApps: [AppSummary]
    
    var formattedTotalDuration: String {
        TotalActivityConfiguration.durationFormatter.string(from: totalDuration) ?? "--"
    }
    
    var focusScore: Int {
        let daySeconds: TimeInterval = 24 * 60 * 60
        let ratio = max(0, min(1, 1 - (totalDuration / daySeconds)))
        return Int((ratio * 100).rounded())
    }
}

struct TotalActivityReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .totalActivity
    let content: (TotalActivityConfiguration) -> TotalActivityView
    
    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> TotalActivityConfiguration {
        // Apple no longer exposes per-app usage breakdowns to third-party reports.
        // Provide a lightweight configuration that points users back to Screen Time.
        return TotalActivityConfiguration(
            generatedAt: Date(),
            periodDescription: "Screen Time Insights",
            totalDuration: 0,
            topApps: []
        )
    }
}
