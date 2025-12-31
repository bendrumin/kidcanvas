// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KidCanvas",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "KidCanvas",
            targets: ["KidCanvas"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/supabase-community/supabase-swift.git", from: "2.0.0"),
        .package(url: "https://github.com/awslabs/aws-sdk-swift.git", from: "0.36.0"),
    ],
    targets: [
        .target(
            name: "KidCanvas",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift"),
                .product(name: "AWSS3", package: "aws-sdk-swift"),
            ]
        ),
    ]
)

