#!/usr/bin/env ruby
# Ensures the stdlib Logger is loaded before CocoaPods boots on Ruby 3.4+
require 'logger'
require 'bundler/setup'
load Gem.bin_path('cocoapods', 'pod')
