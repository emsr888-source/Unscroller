//
//  BlockServiceCoordinator.swift
//  Unscroller
//
//  Created by Cascade on 12/23/25.
//

import Foundation
import React
import SwiftUI

#if canImport(FamilyControls)
import FamilyControls
import ManagedSettings
import DeviceActivity
#endif

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

@available(iOS 16.0, *)
private struct UsageReportHostView: View {
  private static let context = DeviceActivityReport.Context.totalActivity

  var body: some View {
    NavigationStack {
      DeviceActivityReport(context: UsageReportHostView.context)
        .navigationTitle("Screen Time Insights")
        .navigationBarTitleDisplayMode(.inline)
    }
  }
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

enum BlockServiceError: LocalizedError {
  case notSupported
  case presenterUnavailable
  case authorizationDenied
  case missingBlockSet
  case userCancelled
  case invalidInput
  case missingSelection
  case storageUnavailable
  case scheduleError(String)

  var errorDescription: String? {
    switch self {
    case .notSupported:
      return "Screen Time APIs require iOS 16 or later."
    case .presenterUnavailable:
      return "Unable to present the activity picker."
    case .authorizationDenied:
      return "Screen Time authorization is required."
    case .missingBlockSet:
      return "Select or create a focus mode before running blockers."
    case .userCancelled:
      return "Picker cancelled."
    case .invalidInput:
      return "Invalid request payload."
    case .missingSelection:
      return "No apps were selected."
    case .storageUnavailable:
      return "Shared storage unavailable. Ensure App Group is configured."
    case .scheduleError(let text):
      return text
    }
  }
}

@available(iOS 16.0, *)
final class BlockServiceCoordinator {
  static let shared = BlockServiceCoordinator()

  private let authorizationCenter = AuthorizationCenter.shared
  private let deviceActivityCenter = DeviceActivityCenter()
  private let managedStore = ManagedSettingsStore(named: ManagedSettingsStore.Name(BlockServiceConstants.storeName))
  private let encoder = JSONEncoder()
  private let decoder = JSONDecoder()
  private let defaults = UserDefaults(suiteName: BlockServiceConstants.appGroupIdentifier)
  private let tokenEncoder = JSONEncoder()
  private let tokenDecoder = JSONDecoder()

  private init() {
    decoder.dateDecodingStrategy = .millisecondsSince1970
    encoder.dateEncodingStrategy = .millisecondsSince1970
  }

  // MARK: Authorization

  func currentAuthorizationState() -> Bool {
    authorizationCenter.authorizationStatus == .approved
  }

  func authorize() async throws -> Bool {
    do {
      try await authorizationCenter.requestAuthorization(for: .individual)
      return authorizationCenter.authorizationStatus == .approved
    } catch {
      throw BlockServiceError.authorizationDenied
    }
  }

  // MARK: Block Sets

  func storedBlockSet(for id: String) -> BlockSetRecord? {
    blockSetRecords()[id]
  }

  func upsertBlockSetTokens(id: String, iosTokens: [String]) throws {
    guard var map = defaultsDecodedDictionary(key: BlockServiceConstants.blockSetsKey, type: BlockSetRecord.self) else {
      throw BlockServiceError.storageUnavailable
    }
    let existing = map[id]
    let record = BlockSetRecord(id: id, iosTokens: iosTokens, androidPackages: existing?.androidPackages ?? [])
    map[id] = record
    try persistDictionary(map, key: BlockServiceConstants.blockSetsKey)
  }

  func setShieldTheme(_ theme: ShieldThemeRecord) throws {
    guard var map = defaultsDecodedDictionary(key: BlockServiceConstants.shieldThemesKey, type: ShieldThemeRecord.self) else {
      throw BlockServiceError.storageUnavailable
    }
    map[theme.blockSetId] = theme
    try persistDictionary(map, key: BlockServiceConstants.shieldThemesKey)
  }

  // MARK: Picker

  @MainActor
  func presentPicker(for blockSetId: String, completion: @escaping (Result<[String], Error>) -> Void) {
    let selection = currentSelection(for: blockSetId)
    let view = ActivityPickerScreen(
      initialSelection: selection,
      onConfirm: { newSelection in
        let tokens = newSelection.applicationTokens.compactMap { serializeToken($0) }
        completion(.success(tokens))
      },
      onCancel: {
        completion(.failure(BlockServiceError.userCancelled))
      }
    )

    let controller = ActivityPickerViewController(rootView: view)
    controller.modalPresentationStyle = .formSheet

    guard let presenter = RCTPresentedViewController() else {
      completion(.failure(BlockServiceError.presenterUnavailable))
      return
    }

    presenter.present(controller, animated: true)
  }

  @MainActor
  func presentUsageReport() throws {
    guard authorizationCenter.authorizationStatus == .approved else {
      throw BlockServiceError.authorizationDenied
    }
    guard let presenter = RCTPresentedViewController() else {
      throw BlockServiceError.presenterUnavailable
    }
    let controller = UIHostingController(rootView: UsageReportHostView())
    controller.modalPresentationStyle = .pageSheet
    presenter.present(controller, animated: true)
  }

  private func currentSelection(for blockSetId: String) -> FamilyActivitySelection {
    var selection = FamilyActivitySelection()
    guard let blockSet = storedBlockSet(for: blockSetId) else {
      return selection
    }
    let tokens = blockSet.iosTokens.compactMap { deserializeToken($0) }
    selection.applicationTokens = Set(tokens)
    return selection
  }

  // MARK: Schedules

  func saveSchedule(_ schedule: ScheduleRecord) throws {
    guard var map = defaultsDecodedDictionary(key: BlockServiceConstants.schedulesKey, type: ScheduleRecord.self) else {
      throw BlockServiceError.storageUnavailable
    }
    map[schedule.id] = schedule
    try persistDictionary(map, key: BlockServiceConstants.schedulesKey)
  }

  func removeSchedule(id: String) throws {
    guard var map = defaultsDecodedDictionary(key: BlockServiceConstants.schedulesKey, type: ScheduleRecord.self) else {
      throw BlockServiceError.storageUnavailable
    }
    map.removeValue(forKey: id)
    try persistDictionary(map, key: BlockServiceConstants.schedulesKey)
  }

  func scheduleRecord(for id: String) -> ScheduleRecord? {
    defaultsDecodedDictionary(key: BlockServiceConstants.schedulesKey, type: ScheduleRecord.self)?[id]
  }

  func startMonitoring(schedule: ScheduleRecord) throws {
    let start = try timeComponents(schedule.startLocalTime)
    let end = try timeComponents(schedule.endLocalTime)

    for day in schedule.days {
      let name = DeviceActivityName("\(schedule.id).day.\(day)")
      var startComponents = start
      startComponents.weekday = weekdayComponent(for: day)

      var endComponents = end
      endComponents.weekday = weekdayComponent(for: day)

      let definition = DeviceActivitySchedule(intervalStart: startComponents, intervalEnd: endComponents, repeats: true)
      try deviceActivityCenter.startMonitoring(name, during: definition)
    }
  }

  func stopMonitoring(schedule: ScheduleRecord) {
    for day in schedule.days {
      let name = DeviceActivityName("\(schedule.id).day.\(day)")
      do {
        try deviceActivityCenter.stopMonitoring(name)
      } catch {
        // ignore stop failures
      }
    }
  }

  // MARK: Tasks / Shields

  func startTask(blockSetId: String, task: TaskRecord) throws {
    let tokens = try applicationTokens(for: blockSetId)
    guard !tokens.isEmpty else {
      throw BlockServiceError.missingSelection
    }
    managedStore.shield.applications = .specific(tokens)

    let record = task
    try persist(record, key: BlockServiceConstants.activeTaskKey)
  }

  func stopTask(taskId: String) {
    managedStore.shield.applications = nil
    clearValue(forKey: BlockServiceConstants.activeTaskKey)
  }

  // MARK: Limits

  func saveAppLimits(_ limits: [AppLimitRecord]) throws {
    try persistDictionary(Dictionary(uniqueKeysWithValues: limits.map { ($0.appId, $0) }), key: BlockServiceConstants.appLimitsKey)
  }

  func saveSessionLimit(_ record: SessionLimitRecord) throws {
    guard var map = defaultsDecodedDictionary(key: BlockServiceConstants.sessionLimitsKey, type: SessionLimitRecord.self) else {
      throw BlockServiceError.storageUnavailable
    }
    let key = "\(record.blockSetId)#\(record.appId)"
    map[key] = record
    try persistDictionary(map, key: BlockServiceConstants.sessionLimitsKey)
  }

  // MARK: Helpers

  private func blockSetRecords() -> [String: BlockSetRecord] {
    defaultsDecodedDictionary(key: BlockServiceConstants.blockSetsKey, type: BlockSetRecord.self) ?? [:]
  }

  private func defaultsDecodedDictionary<T: Codable>(key: String, type: T.Type) -> [String: T]? {
    guard let defaults else { return nil }
    guard let data = defaults.data(forKey: key) else {
      return [:]
    }
    return (try? decoder.decode([String: T].self, from: data)) ?? [:]
  }

  private func persistDictionary<T: Codable>(_ dictionary: [String: T], key: String) throws {
    guard let defaults else { throw BlockServiceError.storageUnavailable }
    let data = try encoder.encode(dictionary)
    defaults.set(data, forKey: key)
  }

  private func persist<T: Codable>(_ value: T, key: String) throws {
    guard let defaults else { throw BlockServiceError.storageUnavailable }
    let data = try encoder.encode(value)
    defaults.set(data, forKey: key)
  }

  private func clearValue(forKey key: String) {
    defaults?.removeObject(forKey: key)
  }

  private func applicationTokens(for blockSetId: String) throws -> Set<ApplicationToken> {
    guard let blockSet = storedBlockSet(for: blockSetId) else {
      throw BlockServiceError.missingBlockSet
    }
    let tokens: [ApplicationToken] = blockSet.iosTokens.compactMap { deserializeToken($0) }
    return Set(tokens)
  }

  private func serializeToken(_ token: ApplicationToken) -> String? {
    guard let data = try? tokenEncoder.encode(token) else {
      return nil
    }
    return data.base64EncodedString()
  }

  private func deserializeToken(_ string: String) -> ApplicationToken? {
    guard let data = Data(base64Encoded: string),
          let token = try? tokenDecoder.decode(ApplicationToken.self, from: data) else {
      return nil
    }
    return token
  }

  private func weekdayComponent(for dayIndex: Int) -> Int {
    // JS side: 0 = Sunday
    let normalized = max(0, min(dayIndex, 6))
    return normalized + 1
  }

  private func timeComponents(_ value: String) throws -> DateComponents {
    let parts = value.split(separator: ":")
    guard parts.count == 2,
          let hour = Int(parts[0]),
          let minute = Int(parts[1]) else {
      throw BlockServiceError.scheduleError("Invalid time format \(value)")
    }
    var components = DateComponents()
    components.hour = hour
    components.minute = minute
    return components
  }
}

@available(iOS 16.0, *)
final class ActivityPickerViewController: UIHostingController<ActivityPickerScreen> {
  init(rootView: ActivityPickerScreen) {
    super.init(rootView: rootView)
  }

  @MainActor required dynamic init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}

@available(iOS 16.0, *)
struct ActivityPickerScreen: View {
  @Environment(\.dismiss) private var dismiss
  @State private var selection: FamilyActivitySelection
  let onConfirm: (FamilyActivitySelection) -> Void
  let onCancel: () -> Void

  init(initialSelection: FamilyActivitySelection,
       onConfirm: @escaping (FamilyActivitySelection) -> Void,
       onCancel: @escaping () -> Void) {
    _selection = State(initialValue: initialSelection)
    self.onConfirm = onConfirm
    self.onCancel = onCancel
  }

  var body: some View {
    NavigationStack {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Choose apps to block")
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button("Cancel") {
              onCancel()
              dismiss()
            }
          }
          ToolbarItem(placement: .confirmationAction) {
            Button("Done") {
              onConfirm(selection)
              dismiss()
            }
          }
        }
    }
  }
}
