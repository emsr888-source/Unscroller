//
//  BlockServiceReport.swift
//  BlockServiceReport
//
//  Created by Emiliano San Roman on 2025-12-23.
//

import DeviceActivity
import ExtensionKit
import SwiftUI

@main
struct BlockServiceReport: DeviceActivityReportExtension {
    var body: some DeviceActivityReportScene {
        // Create a report for each DeviceActivityReport.Context that your app supports.
        TotalActivityReport { configuration in
            TotalActivityView(configuration: configuration)
        }
        // Add more reports here...
    }
}
