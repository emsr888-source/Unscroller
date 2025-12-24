//
//  BlockServiceModule.swift
//  Unscroller
//
//  Created by Cascade on 12/23/25.
//

import Foundation
import React

@objc(BlockService)
class BlockServiceModule: RCTEventEmitter {
  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    []
  }

  private func guardCoordinator(_ reject: RCTPromiseRejectBlock) -> BlockServiceCoordinator? {
    guard #available(iOS 16.0, *) else {
      reject.call(BlockServiceError.notSupported)
      return nil
    }
    return BlockServiceCoordinator.shared
  }

  private func reject(_ reject: RCTPromiseRejectBlock, _ error: Error) {
    let nsError = error as NSError
    reject(nsError.domain, error.localizedDescription, error)
  }

  // MARK: Authorization

  @objc func authorize(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let coordinator = guardCoordinator(reject) else { return }
    Task {
      do {
        let approved = try await coordinator.authorize()
        resolve([
          "authorized": approved,
          "platform": "ios",
          "shieldsAvailable": approved,
        ])
      } catch {
        reject(reject, error)
      }
    }
  }

  @objc func getPermissionState(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard let coordinator = guardCoordinator(reject) else { return }
    let authorized = coordinator.currentAuthorizationState()
    resolve([
      "usage": authorized,
      "accessibility": authorized,
      "overlay": authorized,
    ])
  }

  // MARK: Picker

  @objc func pickAppsForBlockSet(_ blockSetId: NSString,
                                 resolver resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let coordinator = guardCoordinator(reject) else { return }
    DispatchQueue.main.async {
      coordinator.presentPicker(for: blockSetId as String) { result in
        switch result {
        case .success(let tokens):
          do {
            try coordinator.upsertBlockSetTokens(id: blockSetId as String, iosTokens: tokens)
            resolve([
              "id": blockSetId,
              "iosTokens": tokens,
              "androidPackages": [],
            ])
          } catch {
            self.reject(reject, error)
          }
        case .failure(let error):
          self.reject(reject, error)
        }
      }
    }
  }

  // MARK: Schedules

  @objc func addSchedule(_ payload: NSDictionary,
                         resolver resolve: RCTPromiseResolveBlock,
                         rejecter reject: RCTPromiseRejectBlock) {
    guard let coordinator = guardCoordinator(reject) else { return }
    do {
      let record = try ScheduleRecord.from(dictionary: payload)
      try coordinator.saveSchedule(record)
      try coordinator.startMonitoring(schedule: record)
      resolve(nil)
    } catch {
      reject(reject, error)
    }
  }

  @objc func removeSchedule(_ scheduleId: NSString,
                            resolver resolve: RCTPromiseResolveBlock,
                            rejecter reject: RCTPromiseRejectBlock) {
    guard let coordinator = guardCoordinator(reject) else { return }
    do {
      if let record = coordinator.scheduleRecord(for: scheduleId as String) {
        coordinator.stopMonitoring(schedule: record)
      }
      try coordinator.removeSchedule(id: scheduleId as String)
      resolve(nil)
    } catch {
      reject(reject, error)
    }
  }

  // MARK: Tasks

  @objc func startTask(_ taskPayload: NSDictionary,
                       resolver resolve: RCTPromiseResolveBlock,
                       rejecter reject: RCTPromiseRejectBlock) {
    guard let coordinator = guardCoordinator(reject) else { return }
    do {
      let record = try TaskRecord.from(dictionary: taskPayload)
      try coordinator.startTask(blockSetId: record.blockSetId, task: record)
      resolve(nil)
    } catch {
      reject(reject, error)
    }
  }

  @objc func stopTask(_ taskId: NSString,
                      resolver resolve: RCTPromiseResolveBlock,
                      rejecter reject: RCTPromiseRejectBlock) {
    guard guardCoordinator(reject) != nil else { return }
    if #available(iOS 16.0, *) {
      BlockServiceCoordinator.shared.stopTask(taskId: taskId as String)
    }
    resolve(nil)
  }

  // MARK: Limits

  @objc func setAppLimits(_ limitsArray: NSArray,
                          resolver resolve: RCTPromiseResolveBlock,
                          rejecter reject: RCTPromiseRejectBlock) {
    guard let coordinator = guardCoordinator(reject) else { return }
    do {
      let limits = try limitsArray.compactMap { item -> AppLimitRecord in
        guard let dict = item as? NSDictionary,
              let appId = dict["appId"] as? String,
              let minutes = dict["minutesPerDay"] as? NSNumber else {
          throw BlockServiceError.invalidInput
        }
        return AppLimitRecord(appId: appId, minutesPerDay: minutes.intValue)
      }
      try coordinator.saveAppLimits(limits)
      resolve(nil)
    } catch {
      reject(reject, error)
    }
  }

  @objc func setShieldTheme(_ blockSetId: NSString,
                            emoji: NSString,
                            message: NSString,
                            backgroundColor: NSString?,
                            resolver resolve: RCTPromiseResolveBlock,
                            rejecter reject: RCTPromiseRejectBlock) {
    guard let coordinator = guardCoordinator(reject) else { return }
    do {
      let theme = ShieldThemeRecord(
        blockSetId: blockSetId as String,
        emoji: emoji as String,
        message: message as String,
        backgroundColor: backgroundColor as String?
      )
      try coordinator.setShieldTheme(theme)
      resolve(nil)
    } catch {
      reject(reject, error)
    }
  }

  // MARK: Unsupported stubs

  @objc func getUsage(_ fromTs: NSNumber,
                      toTs: NSNumber,
                      resolver resolve: RCTPromiseResolveBlock,
                      rejecter reject: RCTPromiseRejectBlock) {
    reject.call(BlockServiceError.notSupported)
  }

  @objc func getUsageSummary(_ fromTs: NSNumber,
                             toTs: NSNumber,
                             resolver resolve: RCTPromiseResolveBlock,
                             rejecter reject: RCTPromiseRejectBlock) {
    reject.call(BlockServiceError.notSupported)
  }

  @objc func allowOneMinute(_ appId: NSString,
                            resolver resolve: RCTPromiseResolveBlock,
                            rejecter reject: RCTPromiseRejectBlock) {
    reject.call(BlockServiceError.notSupported)
  }

  @objc func openPermissionSettings(_ target: NSString,
                                    resolver resolve: RCTPromiseResolveBlock,
                                    rejecter reject: RCTPromiseRejectBlock) {
    guard let url = URL(string: UIApplication.openSettingsURLString) else {
      reject.call(BlockServiceError.presenterUnavailable)
      return
    }
    DispatchQueue.main.async {
      UIApplication.shared.open(url) { success in
        if success {
          resolve(nil)
        } else {
          reject.call(BlockServiceError.presenterUnavailable)
        }
      }
    }
  }

  @objc func showUsageReport(_ resolve: RCTPromiseResolveBlock,
                             rejecter reject: RCTPromiseRejectBlock) {
    guard let coordinator = guardCoordinator(reject) else { return }
    DispatchQueue.main.async {
      do {
        try coordinator.presentUsageReport()
        resolve(nil)
      } catch {
        self.reject(reject, error)
      }
    }
  }
}

@available(iOS 16.0, *)
private extension ScheduleRecord {
  static func from(dictionary: NSDictionary) throws -> ScheduleRecord {
    guard
      let id = dictionary["id"] as? String,
      let name = dictionary["name"] as? String,
      let blockSetId = dictionary["blockSetId"] as? String,
      let days = dictionary["days"] as? [NSNumber],
      let start = dictionary["startLocalTime"] as? String,
      let end = dictionary["endLocalTime"] as? String
    else {
      throw BlockServiceError.invalidInput
    }
    return ScheduleRecord(
      id: id,
      name: name,
      blockSetId: blockSetId,
      days: days.map { $0.intValue },
      startLocalTime: start,
      endLocalTime: end
    )
  }
}

@available(iOS 16.0, *)
private extension TaskRecord {
  static func from(dictionary: NSDictionary) throws -> TaskRecord {
    guard
      let id = dictionary["id"] as? String,
      let blockSetId = dictionary["blockSetId"] as? String,
      let title = dictionary["title"] as? String,
      let duration = dictionary["durationMin"] as? NSNumber
    else {
      throw BlockServiceError.invalidInput
    }
    let startTs = (dictionary["startsAt"] as? NSNumber)?.doubleValue ?? Date().timeIntervalSince1970 * 1000
    let date = Date(timeIntervalSince1970: startTs / 1000)
    return TaskRecord(id: id, blockSetId: blockSetId, title: title, durationMin: duration.intValue, startedAt: date)
  }
}

private extension RCTPromiseRejectBlock {
  func call(_ error: Error) {
    let nsError = error as NSError
    self(nsError.domain, error.localizedDescription, error)
  }
}

private extension BlockServiceError {
  var code: String {
    switch self {
    case .notSupported: return "not_supported"
    case .presenterUnavailable: return "presenter_unavailable"
    case .authorizationDenied: return "authorization_denied"
    case .missingBlockSet: return "missing_block_set"
    case .userCancelled: return "user_cancelled"
    case .invalidInput: return "invalid_input"
    case .missingSelection: return "missing_selection"
    case .storageUnavailable: return "storage_unavailable"
    case .scheduleError: return "schedule_error"
    }
  }
}

private extension RCTPromiseRejectBlock {
  func call(_ error: BlockServiceError) {
    self(error.code, error.localizedDescription, error)
  }
}
