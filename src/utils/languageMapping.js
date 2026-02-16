/**
 * Language mapping for Wandbox API (Free, Public)
 * Maps common language identifiers to GUARANTEED EXISTING Wandbox compiler names
 * Data verified via live API check.
 */

export const SUPPORTED_LANGUAGES = [
    // EXACT verified strings, but with CLEANER UI names
    { id: 'javascript', name: 'JavaScript', wandboxCompiler: 'nodejs-18.20.4', version: '18.20.4', ext: '.js' },
    { id: 'python', name: 'Python', wandboxCompiler: 'cpython-3.7.17', version: '3.7.17', ext: '.py' },
    { id: 'cpp', name: 'C++', wandboxCompiler: 'gcc-13.2.0', version: 'GCC 13.2.0', ext: '.cpp' },
    { id: 'java', name: 'Java', wandboxCompiler: 'openjdk-jdk-21+35', version: 'OpenJDK 21', ext: '.java' },
    { id: 'c', name: 'C', wandboxCompiler: 'gcc-13.2.0-c', version: 'GCC 13.2.0', ext: '.c' },
    { id: 'typescript', name: 'TypeScript', wandboxCompiler: 'typescript-5.0.3', version: '5.0.3', ext: '.ts' },
    { id: 'go', name: 'Go', wandboxCompiler: 'go-1.14.15', version: '1.14.15', ext: '.go' },
    { id: 'rust', name: 'Rust', wandboxCompiler: 'rust-1.64.0', version: '1.64.0', ext: '.rs' },
    { id: 'bash', name: 'Bash', wandboxCompiler: 'bash', version: '5.2.0', ext: '.sh' },
    { id: 'lua', name: 'Lua', wandboxCompiler: 'lua-5.4.4', version: '5.4.4', ext: '.lua' },
    { id: 'perl', name: 'Perl', wandboxCompiler: 'perl-5.36.0', version: '5.36.0', ext: '.pl' },
    { id: 'r', name: 'R', wandboxCompiler: 'r-4.2.3', version: '4.2.3', ext: '.r' },
    { id: 'ruby', name: 'Ruby', wandboxCompiler: 'ruby-3.2.1', version: '3.2.1', ext: '.rb' },
    { id: 'php', name: 'PHP', wandboxCompiler: 'php-8.2.4', version: '8.2.4', ext: '.php' },
    { id: 'csharp', name: 'C#', wandboxCompiler: 'mono-6.12.0.122-head', version: 'Mono 6.12', ext: '.cs' },
    { id: 'swift', name: 'Swift', wandboxCompiler: 'swift-5.8', version: '5.8', ext: '.swift' },
    { id: 'kotlin', name: 'Kotlin', wandboxCompiler: 'kotlin-1.8.10', version: '1.8.10', ext: '.kt' },
    { id: 'scala', name: 'Scala', wandboxCompiler: 'scala-3.2.2', version: '3.2.2', ext: '.scala' },
    { id: 'haskell', name: 'Haskell', wandboxCompiler: 'ghc-9.4.4', version: 'GHC 9.4.4', ext: '.hs' },
    { id: 'elixir', name: 'Elixir', wandboxCompiler: 'elixir-1.14.3', version: '1.14.3', ext: '.ex' },
];

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
};

export const getWandboxCompiler = (language) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.id === language);
    return lang ? lang.wandboxCompiler : 'nodejs-18.20.4';
};

export const getCodeMirrorMode = (language) => {
    return CODEMIRROR_MODES[language] || { name: 'javascript', json: true };
};

export const getLanguageVersion = (languageId) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.id === languageId);
    return lang ? lang.version : '';
};

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
    };
    return templates[language] || '// Write your code here';
};
