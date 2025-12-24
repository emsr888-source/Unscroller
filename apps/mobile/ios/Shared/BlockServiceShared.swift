import Foundation

enum BlockServiceConstants {
    static let appGroupIdentifier = "group.org.name.Unscroller"
    static let storeName = "blockservice"
    static let blockSetsKey = "block_service.block_sets"
    static let schedulesKey = "block_service.schedules"
    static let shieldThemesKey = "block_service.shield_themes"
    static let activeTaskKey = "block_service.active_task"
    static let sessionLimitsKey = "block_service.session_limits"
    static let appLimitsKey = "block_service.app_limits"
}

struct ShieldThemeRecord: Codable {
    let blockSetId: String
    let emoji: String
    let message: String
    let backgroundColor: String?
}

struct BlockSetRecord: Codable {
    let id: String
    var iosTokens: [String]
    var androidPackages: [String]
}

struct ScheduleRecord: Codable {
    let id: String
    let name: String
    let blockSetId: String
    let days: [Int]
    let startLocalTime: String
    let endLocalTime: String
}

struct TaskRecord: Codable {
    let id: String
    let blockSetId: String
    let title: String
    let durationMin: Int
    let startedAt: Date
}

struct AppLimitRecord: Codable {
    let appId: String
    let minutesPerDay: Int
}

struct SessionLimitRecord: Codable {
    let blockSetId: String
    let appId: String
    let minutes: Int
}

struct UsageSampleRecord: Codable {
    let ts: Int
    let appId: String
    let foregroundMs: Int
}

enum BlockServiceSharedStoreError: Error {
    case storageUnavailable
}

final class BlockServiceSharedStore {
    static let shared = BlockServiceSharedStore()

    let defaults = UserDefaults(suiteName: BlockServiceConstants.appGroupIdentifier)
    let encoder = JSONEncoder()
    let decoder = JSONDecoder()

    private init() {
        decoder.dateDecodingStrategy = .millisecondsSince1970
        encoder.dateEncodingStrategy = .millisecondsSince1970
    }

    func dictionary<T: Codable>(forKey key: String, as type: T.Type) -> [String: T]? {
        guard let data = defaults?.data(forKey: key) else {
            return nil
        }
        return try? decoder.decode([String: T].self, from: data)
    }

    func saveDictionary<T: Codable>(_ dictionary: [String: T], key: String) throws {
        guard let defaults else { throw BlockServiceSharedStoreError.storageUnavailable }
        let data = try encoder.encode(dictionary)
        defaults.set(data, forKey: key)
    }

    func saveValue<T: Codable>(_ value: T, key: String) throws {
        guard let defaults else { throw BlockServiceSharedStoreError.storageUnavailable }
        let data = try encoder.encode(value)
        defaults.set(data, forKey: key)
    }

    func removeValue(forKey key: String) {
        defaults?.removeObject(forKey: key)
    }
}
