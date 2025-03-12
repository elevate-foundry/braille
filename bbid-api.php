<?php
// Set headers to allow cross-origin requests and specify JSON content type
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Simulate BBID data for demonstration purposes
// In a real implementation, this would come from a database or other storage
$bbidData = [
    [
        'id' => 'bbid_' . md5('Ryan Mac'),
        'metadata' => [
            'created' => date('c', strtotime('-1 day')),
            'modified' => date('c'),
            'name' => 'Ryan Mac',
            'type' => 'desktop',
            'os' => 'linux',
            'osVersion' => 'Ubuntu 22.04',
            'browser' => 'Firefox',
            'browserVersion' => '115.0',
            'processor' => 'x86_64',
            'screen' => '1920x1080',
            'language' => 'en-US',
            'timezone' => 'America/Denver',
            'location' => [
                'city' => 'Salt Lake City',
                'region' => 'UT',
                'country' => 'USA',
                'coordinates' => [
                    'latitude' => 40.76,
                    'longitude' => -111.89
                ]
            ]
        ],
        'fingerprint' => [
            'raw' => hash('sha256', 'Ryan Mac Linux Firefox'),
            'bbes' => '⠃⠃⠑⠎_' . substr(hash('sha256', 'Ryan Mac Linux Firefox'), 0, 10),
            'algorithm' => 'sha256',
            'components' => [
                'userAgent' => 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:115.0) Gecko/20100101 Firefox/115.0',
                'language' => 'en-US',
                'platform' => 'Linux x86_64',
                'screenResolution' => '1920x1080',
                'timezone' => 'America/Denver',
                'plugins' => 'PDF Viewer, Firefox PDF Viewer',
                'fonts' => 'Ubuntu, DejaVu Sans, Liberation Sans'
            ]
        ],
        'usage' => [
            'lastSeen' => date('c'),
            'visitCount' => 3,
            'totalTimeSpent' => 1200,
            'features' => ['learn', 'practice', 'settings'],
            'mcpCompatible' => true
        ],
        'preferences' => [
            'hapticFeedback' => true,
            'voiceAssistant' => true,
            'theme' => 'system',
            'accessibility' => [
                'highContrast' => false,
                'largeText' => false,
                'screenReader' => false
            ]
        ]
    ]
];

// Output the data as JSON
echo json_encode($bbidData, JSON_PRETTY_PRINT);
?>
