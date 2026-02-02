/**
 * Language mapping for Piston API
 * Maps common language identifiers to Piston-compatible names
 */

// Map of common identifiers to Piston language names
export const LANGUAGE_MAP = {
    javascript: 'javascript',
    js: 'javascript',
    python: 'python',
    py: 'python',
    python3: 'python',
    cpp: 'c++',
    'c++': 'c++',
    c: 'c',
    java: 'java',
    typescript: 'typescript',
    ts: 'typescript',
    go: 'go',
    golang: 'go',
    rust: 'rust',
    rs: 'rust',
    ruby: 'ruby',
    rb: 'ruby',
    php: 'php',
    csharp: 'csharp',
    'c#': 'csharp',
    cs: 'csharp',
    swift: 'swift',
    kotlin: 'kotlin',
    kt: 'kotlin',
    bash: 'bash',
    shell: 'bash',
    sql: 'sql',
    perl: 'perl',
    r: 'r',
    scala: 'scala',
    lua: 'lua',
    haskell: 'haskell',
    elixir: 'elixir',
    clojure: 'clojure',
    dart: 'dart',
    julia: 'julia',
    pascal: 'pascal',
    fortran: 'fortran',
    cobol: 'cobol',
    zig: 'zig',
};

// Supported languages with display names and Piston identifiers
export const SUPPORTED_LANGUAGES = [
    { id: 'javascript', name: 'JavaScript', pistonId: 'javascript' },
    { id: 'python', name: 'Python', pistonId: 'python' },
    { id: 'cpp', name: 'C++', pistonId: 'c++' },
    { id: 'java', name: 'Java', pistonId: 'java' },
    { id: 'c', name: 'C', pistonId: 'c' },
    { id: 'typescript', name: 'TypeScript', pistonId: 'typescript' },
    { id: 'go', name: 'Go', pistonId: 'go' },
    { id: 'rust', name: 'Rust', pistonId: 'rust' },
    { id: 'ruby', name: 'Ruby', pistonId: 'ruby' },
    { id: 'php', name: 'PHP', pistonId: 'php' },
    { id: 'csharp', name: 'C#', pistonId: 'csharp' },
    { id: 'swift', name: 'Swift', pistonId: 'swift' },
    { id: 'kotlin', name: 'Kotlin', pistonId: 'kotlin' },
    { id: 'bash', name: 'Bash', pistonId: 'bash' },
    { id: 'lua', name: 'Lua', pistonId: 'lua' },
    { id: 'perl', name: 'Perl', pistonId: 'perl' },
    { id: 'r', name: 'R', pistonId: 'r' },
    { id: 'scala', name: 'Scala', pistonId: 'scala' },
    { id: 'haskell', name: 'Haskell', pistonId: 'haskell' },
    { id: 'elixir', name: 'Elixir', pistonId: 'elixir' },
    { id: 'dart', name: 'Dart', pistonId: 'dart' },
];

// CodeMirror mode mapping
export const CODEMIRROR_MODES = {
    javascript: { name: 'javascript', json: true },
    python: { name: 'python' },
    cpp: { name: 'text/x-c++src' },
    c: { name: 'text/x-csrc' },
    java: { name: 'text/x-java' },
    typescript: { name: 'javascript', typescript: true },
    go: { name: 'go' },
    rust: { name: 'rust' },
    ruby: { name: 'ruby' },
    php: { name: 'php' },
    csharp: { name: 'text/x-csharp' },
    swift: { name: 'swift' },
    kotlin: { name: 'text/x-kotlin' },
    bash: { name: 'shell' },
    lua: { name: 'lua' },
    perl: { name: 'perl' },
    r: { name: 'r' },
    scala: { name: 'text/x-scala' },
    haskell: { name: 'haskell' },
    elixir: { name: 'elixir' },
    dart: { name: 'dart' },
};

/**
 * Get Piston-compatible language name
 * @param {string} language - Language identifier
 * @returns {string} Piston language name
 */
export const getPistonLanguage = (language) => {
    const normalized = language.toLowerCase().trim();
    return LANGUAGE_MAP[normalized] || normalized;
};

/**
 * Get CodeMirror mode for a language
 * @param {string} language - Language identifier
 * @returns {Object} CodeMirror mode configuration
 */
export const getCodeMirrorMode = (language) => {
    return CODEMIRROR_MODES[language] || { name: 'javascript', json: true };
};

/**
 * Get default code template for a language
 * @param {string} language - Language identifier
 * @returns {string} Default code template
 */
export const getDefaultCode = (language) => {
    const templates = {
        javascript: '// JavaScript\nconsole.log("Hello, World!");',
        python: '# Python\nprint("Hello, World!")',
        cpp: '// C++\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
        java: '// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
        c: '// C\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
        typescript: '// TypeScript\nconsole.log("Hello, World!");',
        go: '// Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
        rust: '// Rust\nfn main() {\n    println!("Hello, World!");\n}',
        ruby: '# Ruby\nputs "Hello, World!"',
        php: '<?php\n// PHP\necho "Hello, World!";',
        csharp: '// C#\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
        swift: '// Swift\nprint("Hello, World!")',
        kotlin: '// Kotlin\nfun main() {\n    println("Hello, World!")\n}',
        bash: '#!/bin/bash\n# Bash\necho "Hello, World!"',
        lua: '-- Lua\nprint("Hello, World!")',
        perl: '# Perl\nprint "Hello, World!\\n";',
        r: '# R\nprint("Hello, World!")',
        scala: '// Scala\nobject Main extends App {\n    println("Hello, World!")\n}',
        haskell: '-- Haskell\nmain = putStrLn "Hello, World!"',
        elixir: '# Elixir\nIO.puts "Hello, World!"',
        dart: '// Dart\nvoid main() {\n  print("Hello, World!");\n}',
    };
    return templates[language] || '// Write your code here';
};
