#!/usr/bin/env ruby
require 'xcodeproj'

root = File.expand_path('..', __dir__)
project_path = File.join(root, 'ios', 'App', 'App.xcodeproj')
test_dir = File.join(root, 'ios', 'App', 'AppUITests')
abort 'Missing generated Xcode project; run npm run ios:init first.' unless File.exist?(project_path)
abort 'Missing AppUITests sources; run npm run ios:tests:install first.' unless Dir.exist?(test_dir)

project = Xcodeproj::Project.open(project_path)
app_target = project.targets.find { |t| t.name == 'App' }
abort 'App target not found.' unless app_target

test_target = project.targets.find { |t| t.name == 'AppUITests' }
unless test_target
  test_target = project.new_target(:ui_test_bundle, 'AppUITests', :ios, app_target.deployment_target || '15.0')
  test_target.add_dependency(app_target)
end

group = project.main_group.find_subpath('AppUITests', true)
Dir.glob(File.join(test_dir, '*.swift')).sort.each do |source|
  name = File.basename(source)
  ref = group.files.find { |f| f.path == name } || group.new_file(source)
  unless test_target.source_build_phase.files_references.include?(ref)
    test_target.source_build_phase.add_file_reference(ref)
  end
end

test_target.build_configurations.each do |config|
  settings = config.build_settings
  settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'app.supersimplespeedo.ios.uitests'
  settings['PRODUCT_NAME'] = '$(TARGET_NAME)'
  settings['PRODUCT_MODULE_NAME'] = '$(TARGET_NAME:c99extidentifier)'
  settings['SWIFT_VERSION'] = '5.0'
  settings['TEST_TARGET_NAME'] = 'App'
  settings['TEST_HOST'] = ''
  settings['BUNDLE_LOADER'] = ''
  settings['CODE_SIGNING_ALLOWED'] = 'NO'
end

project.save

scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app_target)
scheme.add_test_target(test_target)
scheme.set_launch_target(app_target)
scheme.save_as(project_path, 'Frenano-CI', true)
puts 'Configured AppUITests target and shared Frenano-CI scheme.'
