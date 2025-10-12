Pod::Spec.new do |spec|
  spec.name         = 'boost'
  spec.version      = '1.83.0'
  spec.license      = { :type => 'Boost Software License', :file => "LICENSE_1_0.txt" }
  spec.summary      = 'Boost provides free peer-reviewed portable C++ source libraries.'
  spec.authors      = { 'Boost' => 'https://www.boost.org' }
  spec.homepage     = 'https://www.boost.org'
  spec.requires_arc = false

    spec.source       = { :http => 'file:///dev/null' }
  spec.header_mappings_dir = 'boost'
  spec.source_files  = 'boost/**/*.hpp', 'boost/**/*.h'
  spec.public_header_files = 'boost/**/*.hpp', 'boost/**/*.h'
end
