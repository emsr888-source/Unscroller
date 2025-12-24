//
//  ShieldConfigurationExtension.swift
//  BlockServiceShield
//
//  Created by Emiliano San Roman on 2025-12-23.
//

import FamilyControls
import Foundation
import ManagedSettings
import ManagedSettingsUI
import UIKit

private enum ShieldSharedConstants {
    static let appGroupIdentifier = "group.org.name.Unscroller"
    static let shieldThemesKey = "block_service.shield_themes"
    static let blockSetsKey = "block_service.block_sets"
}

private struct ShieldThemeRecord: Codable {
    let blockSetId: String
    let emoji: String
    let message: String
    let backgroundColor: String?
}

private struct BlockSetRecord: Codable {
    let id: String
    let iosTokens: [String]
    let androidPackages: [String]
}

private final class ShieldThemeStore {
    private let decoder = JSONDecoder()
    private let tokenDecoder = JSONDecoder()
    private let defaults = UserDefaults(suiteName: ShieldSharedConstants.appGroupIdentifier)

    func theme(for blockSetId: String) -> ShieldThemeRecord? {
        guard let data = defaults?.data(forKey: ShieldSharedConstants.shieldThemesKey) else {
            return nil
        }
        guard let map = try? decoder.decode([String: ShieldThemeRecord].self, from: data) else {
            return nil
        }
        return map[blockSetId]
    }

    func blockSetRecords() -> [String: BlockSetRecord]? {
        guard let data = defaults?.data(forKey: ShieldSharedConstants.blockSetsKey) else {
            return nil
        }
        return try? decoder.decode([String: BlockSetRecord].self, from: data)
    }

    func decodeToken(from value: String) -> ApplicationToken? {
        guard let data = Data(base64Encoded: value) else {
            return nil
        }
        return try? tokenDecoder.decode(ApplicationToken.self, from: data)
    }
}

private extension UIColor {
    convenience init?(hex: String) {
        var formatted = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        formatted = formatted.replacingOccurrences(of: "#", with: "")
        guard formatted.count == 6 || formatted.count == 8 else {
            return nil
        }
        var value: UInt64 = 0
        guard Scanner(string: formatted).scanHexInt64(&value) else {
            return nil
        }
        let hasAlpha = formatted.count == 8
        let divisor = CGFloat(255)
        let alpha = hasAlpha ? CGFloat(value & 0xFF) / divisor : 1
        let blue = CGFloat((value >> (hasAlpha ? 8 : 0)) & 0xFF) / divisor
        let green = CGFloat((value >> (hasAlpha ? 16 : 8)) & 0xFF) / divisor
        let red = CGFloat((value >> (hasAlpha ? 24 : 16)) & 0xFF) / divisor
        self.init(red: red, green: green, blue: blue, alpha: alpha)
    }
}

class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    private let themeStore = ShieldThemeStore()

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        configuration(for: application.token)
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        configuration(for: application.token)
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        ShieldConfiguration()
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        ShieldConfiguration()
    }

    private func configuration(for token: ApplicationToken?) -> ShieldConfiguration {
        guard let token else {
            return ShieldConfiguration()
        }
        guard let blockSetId = blockSetId(for: token),
              let theme = themeStore.theme(for: blockSetId) else {
            return ShieldConfiguration()
        }

        var backgroundColor = UIColor.black
        if let hex = theme.backgroundColor,
           let color = UIColor(hex: hex) {
            backgroundColor = color
        }

        let title = ShieldConfiguration.Label(text: "\(theme.emoji) Stay focused", color: .white)
        let subtitle = ShieldConfiguration.Label(text: theme.message, color: .white.withAlphaComponent(0.85))
        let primary = ShieldConfiguration.Label(text: "I'm done", color: .white)
        let secondary = ShieldConfiguration.Label(text: "Allow one more minute", color: .white)

        return ShieldConfiguration(
            backgroundBlurStyle: .systemMaterialDark,
            backgroundColor: backgroundColor,
            title: title,
            subtitle: subtitle,
            primaryButtonLabel: primary,
            secondaryButtonLabel: secondary
        )
    }

    private func blockSetId(for token: ApplicationToken) -> String? {
        // The coordinator stores shield themes keyed by blockSetId; we assume the currently active block set
        // corresponded to the last shield theme applied. Since DeviceActivity doesn't give context here,
        // we map tokens to block sets based on stored block set records.
        guard let map = themeStore.blockSetRecords() else {
            return nil
        }
        return map.first(where: { entry in
            entry.value.iosTokens.contains { identifier in
                guard let storedToken = themeStore.decodeToken(from: identifier) else {
                    return false
                }
                return storedToken == token
            }
        })?.key
    }
}
