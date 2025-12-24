//
//  DeviceActivityMonitorExtension.swift
//  BlockServiceMonitor
//
//  Created by Emiliano San Roman on 2025-12-23.
//

import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings

private enum BlockServiceSharedConstants {
    static let appGroupIdentifier = "group.org.name.Unscroller"
    static let storeName = "blockservice"
    static let blockSetsKey = "block_service.block_sets"
    static let schedulesKey = "block_service.schedules"
    static let activeBlockSetKey = "block_service.active_block_set"
}

private struct BlockSetRecord: Codable {
    let id: String
    let iosTokens: [String]
    let androidPackages: [String]
}

private struct ScheduleRecord: Codable {
    let id: String
    let name: String
    let blockSetId: String
    let days: [Int]
    let startLocalTime: String
    let endLocalTime: String
}

private final class SharedBlockDataStore {
    private let defaults = UserDefaults(suiteName: BlockServiceSharedConstants.appGroupIdentifier)
    private let decoder = JSONDecoder()
    private let tokenDecoder = JSONDecoder()

    func schedule(for activityName: DeviceActivityName) -> ScheduleRecord? {
        guard let scheduleId = scheduleIdentifier(from: activityName.rawValue) else {
            return nil
        }
        return decodedDictionary(key: BlockServiceSharedConstants.schedulesKey, type: ScheduleRecord.self)?[scheduleId]
    }

    func applicationTokens(for blockSetId: String) -> Set<ApplicationToken>? {
        guard let blockSet = decodedDictionary(key: BlockServiceSharedConstants.blockSetsKey, type: BlockSetRecord.self)?[blockSetId] else {
            return nil
        }
        let tokens = blockSet.iosTokens.compactMap { decodeToken(from: $0) }
        return tokens.isEmpty ? nil : Set(tokens)
    }

    func setActiveBlockSet(_ id: String?) {
        defaults?.set(id, forKey: BlockServiceSharedConstants.activeBlockSetKey)
    }

    private func decodedDictionary<T: Decodable>(key: String, type: T.Type) -> [String: T]? {
        guard let data = defaults?.data(forKey: key) else {
            return nil
        }
        return try? decoder.decode([String: T].self, from: data)
    }

    private func decodeToken(from value: String) -> ApplicationToken? {
        if let data = Data(base64Encoded: value),
           let token = try? tokenDecoder.decode(ApplicationToken.self, from: data) {
            return token
        }
        return nil
    }

    private func scheduleIdentifier(from name: String) -> String? {
        let components = name.split(separator: ".")
        return components.first.map(String.init)
    }
}

class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    private let sharedStore = SharedBlockDataStore()
    private let managedStore = ManagedSettingsStore(named: ManagedSettingsStore.Name(BlockServiceSharedConstants.storeName))

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        guard let schedule = sharedStore.schedule(for: activity) else {
            return
        }
        applyShield(for: schedule.blockSetId)
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        clearShield()
    }

    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)
        guard let schedule = sharedStore.schedule(for: activity) else {
            return
        }
        applyShield(for: schedule.blockSetId)
    }

    private func applyShield(for blockSetId: String) {
        guard let tokens = sharedStore.applicationTokens(for: blockSetId) else {
            return
        }
        managedStore.shield.applications = tokens
        sharedStore.setActiveBlockSet(blockSetId)
    }

    private func clearShield() {
        managedStore.shield.applications = nil
        sharedStore.setActiveBlockSet(nil)
    }
}
