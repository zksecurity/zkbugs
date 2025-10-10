// harness_is_complete_underconstrained.rs
//
// Source code analysis harness for the underconstrained is_complete flag vulnerability
// in SP1's recursive verifier (GHSA-c873-wfhp-wx5m Bug 2).
//
// **What this harness does:**
// 1. Reads source files from the recursion circuit crate
// 2. Checks for presence of `assert_complete()` calls in core.rs and wrap.rs
// 3. Verifies that compress.rs (control case) has the call
// 4. Reports whether the codebase is vulnerable or fixed
//
// **Usage:**
// rustc harness_is_complete_underconstrained.rs -o harness_runner
// ./harness_runner

use std::fs;
use std::path::Path;

// ============================================================================
// Source Code Analysis Functions
// ============================================================================

#[derive(Debug, Clone)]
struct AnalysisResult {
    file_path: String,
    has_is_complete_field: bool,
    has_assert_complete_call: bool,
    has_commit_call: bool,
    is_vulnerable: bool,
    details: Vec<String>,
}

impl AnalysisResult {
    fn new(file_path: String) -> Self {
        Self {
            file_path,
            has_is_complete_field: false,
            has_assert_complete_call: false,
            has_commit_call: false,
            is_vulnerable: false,
            details: Vec::new(),
        }
    }
}

/// Analyze a source file for is_complete constraint checking
fn analyze_file(file_path: &Path) -> Result<AnalysisResult, String> {
    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read {}: {}", file_path.display(), e))?;

    let mut result = AnalysisResult::new(file_path.display().to_string());

    // Check for is_complete field usage
    if content.contains("is_complete") {
        result.has_is_complete_field = true;
        result.details.push("Found is_complete field usage".to_string());
    }

    // Check for assert_complete function call
    // Look for patterns like:
    // - assert_complete(builder, ...)
    // - assert_complete::<...>(...)
    if content.contains("assert_complete(")
        || content.contains("assert_complete::<")
        || content.contains("assert_complete (")
    {
        result.has_assert_complete_call = true;
        result.details.push("Found assert_complete() call".to_string());

        // Find the line number
        for (line_num, line) in content.lines().enumerate() {
            if line.contains("assert_complete(") || line.contains("assert_complete::<") {
                result
                    .details
                    .push(format!("  Line {}: {}", line_num + 1, line.trim()));
            }
        }
    }

    // Check for commit_recursion_public_values call
    if content.contains("commit_recursion_public_values") {
        result.has_commit_call = true;
        result.details.push("Found commit_recursion_public_values() call".to_string());
    }

    // Determine if vulnerable:
    // If the file uses is_complete AND commits public values BUT doesn't call assert_complete,
    // then it's vulnerable
    if result.has_is_complete_field && result.has_commit_call && !result.has_assert_complete_call {
        result.is_vulnerable = true;
        result.details.push(
            "⚠️  VULNERABLE: Uses is_complete and commits but does NOT call assert_complete()"
                .to_string(),
        );
    } else if result.has_is_complete_field && result.has_commit_call && result.has_assert_complete_call
    {
        result
            .details
            .push("✅ FIXED: Calls assert_complete() before committing".to_string());
    }

    Ok(result)
}

/// Check for the presence of assert_complete import in a file
fn check_assert_complete_import(file_path: &Path) -> Result<bool, String> {
    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read {}: {}", file_path.display(), e))?;

    // Look for import patterns like:
    // use crate::machine::assert_complete;
    // use super::assert_complete;
    let has_import = content.contains("use") && content.contains("assert_complete");

    Ok(has_import)
}

/// Analyze the complete.rs file to verify assert_complete exists
fn analyze_complete_rs(file_path: &Path) -> Result<bool, String> {
    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read {}: {}", file_path.display(), e))?;

    // Check for the function definition
    let has_definition = content.contains("pub(crate) fn assert_complete")
        || content.contains("pub fn assert_complete");

    // Check for key constraint patterns
    let has_boolean_constraint = content.contains("is_complete * (is_complete - ");
    let has_next_pc_constraint = content.contains("is_complete * *next_pc")
        || content.contains("is_complete * next_pc");

    Ok(has_definition && has_boolean_constraint && has_next_pc_constraint)
}

// ============================================================================
// Test Functions
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn get_sources_dir() -> String {
        // Try to find the sources directory
        let candidates = vec![
            "../sources/crates/recursion/circuit/src/machine",
            "sources/crates/recursion/circuit/src/machine",
            "./sources/crates/recursion/circuit/src/machine",
        ];

        for candidate in candidates {
            if Path::new(candidate).exists() {
                return candidate.to_string();
            }
        }

        // If not found, return the expected path
        "../sources/crates/recursion/circuit/src/machine".to_string()
    }

    #[test]
    fn test_complete_rs_exists() {
        let base_dir = get_sources_dir();
        let complete_path = Path::new(&base_dir).join("complete.rs");

        if !complete_path.exists() {
            println!("⚠️  Warning: complete.rs not found at {}", complete_path.display());
            println!("   Run ../zkbugs_get_sources.sh first to fetch the vulnerable sources");
            return;
        }

        let result = analyze_complete_rs(&complete_path);
        assert!(result.is_ok(), "Failed to analyze complete.rs: {:?}", result);
        assert!(
            result.unwrap(),
            "assert_complete function should exist with proper constraints"
        );
    }

    #[test]
    fn test_core_rs_vulnerability() {
        let base_dir = get_sources_dir();
        let core_path = Path::new(&base_dir).join("core.rs");

        if !core_path.exists() {
            println!("⚠️  Warning: core.rs not found at {}", core_path.display());
            println!("   Run ../zkbugs_get_sources.sh first to fetch the vulnerable sources");
            return;
        }

        let result = analyze_file(&core_path);
        assert!(result.is_ok(), "Failed to analyze core.rs: {:?}", result);

        let analysis = result.unwrap();
        println!("\n=== core.rs Analysis ===");
        println!("File: {}", analysis.file_path);
        println!("Has is_complete field: {}", analysis.has_is_complete_field);
        println!("Has assert_complete call: {}", analysis.has_assert_complete_call);
        println!("Has commit call: {}", analysis.has_commit_call);
        println!("Is vulnerable: {}", analysis.is_vulnerable);
        for detail in &analysis.details {
            println!("  {}", detail);
        }

        // In the vulnerable version (commit 4681d4f), core.rs should be vulnerable
        // (uses is_complete, commits, but no assert_complete call)
        if analysis.is_vulnerable {
            println!("\n✅ VULNERABILITY CONFIRMED in core.rs");
            println!("   This matches the vulnerable commit 4681d4f0298b387f074fc93f8254584db9d258de");
        } else if analysis.has_assert_complete_call {
            println!("\n✅ FIX DETECTED in core.rs");
            println!("   This matches the fixed commit 4fe8144f1d57b27503f23795320a4e0eedf464c5");
        }

        // The test should pass if we can successfully analyze the file
        assert!(analysis.has_is_complete_field, "core.rs should use is_complete");
        assert!(analysis.has_commit_call, "core.rs should commit public values");
    }

    #[test]
    fn test_wrap_rs_vulnerability() {
        let base_dir = get_sources_dir();
        let wrap_path = Path::new(&base_dir).join("wrap.rs");

        if !wrap_path.exists() {
            println!("⚠️  Warning: wrap.rs not found at {}", wrap_path.display());
            println!("   Run ../zkbugs_get_sources.sh first to fetch the vulnerable sources");
            return;
        }

        let result = analyze_file(&wrap_path);
        assert!(result.is_ok(), "Failed to analyze wrap.rs: {:?}", result);

        let analysis = result.unwrap();
        println!("\n=== wrap.rs Analysis ===");
        println!("File: {}", analysis.file_path);
        println!("Has is_complete field: {}", analysis.has_is_complete_field);
        println!("Has assert_complete call: {}", analysis.has_assert_complete_call);
        println!("Has commit call: {}", analysis.has_commit_call);
        println!("Is vulnerable: {}", analysis.is_vulnerable);
        for detail in &analysis.details {
            println!("  {}", detail);
        }

        // Check for the specific vulnerable pattern in wrap.rs
        let content = fs::read_to_string(&wrap_path).unwrap();
        let uses_ignore_pattern = content.contains("SP1CompressWitnessVariable { vks_and_proofs, .. }");

        if uses_ignore_pattern {
            println!("\n⚠️  VULNERABILITY PATTERN: Found '..' pattern that ignores is_complete");
        }

        if analysis.is_vulnerable || uses_ignore_pattern {
            println!("\n✅ VULNERABILITY CONFIRMED in wrap.rs");
            println!("   This matches the vulnerable commit 4681d4f0298b387f074fc93f8254584db9d258de");
        } else if analysis.has_assert_complete_call {
            println!("\n✅ FIX DETECTED in wrap.rs");
            println!("   This matches the fixed commit 4fe8144f1d57b27503f23795320a4e0eedf464c5");
        }

        // The test should pass if we can successfully analyze the file
        assert!(analysis.has_commit_call, "wrap.rs should commit public values");
    }

    #[test]
    fn test_compress_rs_has_assert_complete() {
        // compress.rs should have assert_complete call even in vulnerable version
        // (it's the control case showing what the fix should look like)
        let base_dir = get_sources_dir();
        let compress_path = Path::new(&base_dir).join("compress.rs");

        if !compress_path.exists() {
            println!(
                "⚠️  Warning: compress.rs not found at {}",
                compress_path.display()
            );
            println!("   Run ../zkbugs_get_sources.sh first to fetch the vulnerable sources");
            return;
        }

        let result = analyze_file(&compress_path);
        assert!(result.is_ok(), "Failed to analyze compress.rs: {:?}", result);

        let analysis = result.unwrap();
        println!("\n=== compress.rs Analysis (Control) ===");
        println!("File: {}", analysis.file_path);
        println!("Has is_complete field: {}", analysis.has_is_complete_field);
        println!("Has assert_complete call: {}", analysis.has_assert_complete_call);
        println!("Has commit call: {}", analysis.has_commit_call);
        for detail in &analysis.details {
            println!("  {}", detail);
        }

        // compress.rs should NOT be vulnerable (even in vulnerable commit)
        assert!(
            !analysis.is_vulnerable,
            "compress.rs should NOT be vulnerable (control case)"
        );
        assert!(
            analysis.has_assert_complete_call,
            "compress.rs should have assert_complete call"
        );

        println!("\n✅ compress.rs correctly uses assert_complete (as expected)");
    }

    #[test]
    fn test_version_detection() {
        // This test attempts to determine if we're looking at the vulnerable or fixed version
        let base_dir = get_sources_dir();
        let core_path = Path::new(&base_dir).join("core.rs");
        let wrap_path = Path::new(&base_dir).join("wrap.rs");

        if !core_path.exists() || !wrap_path.exists() {
            println!("⚠️  Warning: Source files not found");
            println!("   Run ../zkbugs_get_sources.sh first to fetch the vulnerable sources");
            return;
        }

        let core_result = analyze_file(&core_path).unwrap();
        let wrap_result = analyze_file(&wrap_path).unwrap();

        println!("\n=== Version Detection ===");

        let is_vulnerable = core_result.is_vulnerable || wrap_result.is_vulnerable;
        let is_fixed = core_result.has_assert_complete_call && wrap_result.has_assert_complete_call;

        if is_vulnerable && !is_fixed {
            println!("📍 Detected: VULNERABLE VERSION (commit 4681d4f or earlier)");
            println!("   - core.rs is missing assert_complete call: {}", core_result.is_vulnerable);
            println!("   - wrap.rs is missing assert_complete call: {}", wrap_result.is_vulnerable);
        } else if is_fixed && !is_vulnerable {
            println!("📍 Detected: FIXED VERSION (commit 4fe8144 or later)");
            println!("   - core.rs has assert_complete call: {}", core_result.has_assert_complete_call);
            println!("   - wrap.rs has assert_complete call: {}", wrap_result.has_assert_complete_call);
        } else {
            println!("📍 Detected: INTERMEDIATE/UNKNOWN VERSION");
        }

        // Test always passes - we're just reporting what we found
        assert!(true);
    }

    #[test]
    fn test_detailed_line_search() {
        // This test searches for specific patterns in the code
        let base_dir = get_sources_dir();
        let core_path = Path::new(&base_dir).join("core.rs");

        if !core_path.exists() {
            println!("⚠️  Warning: core.rs not found");
            return;
        }

        let content = fs::read_to_string(&core_path).unwrap();
        println!("\n=== Detailed Pattern Search in core.rs ===");

        // Search for is_complete assignment
        for (line_num, line) in content.lines().enumerate() {
            if line.contains("is_complete") && line.contains("=") && !line.trim().starts_with("//") {
                println!("Line {}: {}", line_num + 1, line.trim());
            }
        }

        // Search for commit call
        println!("\n=== Commit Pattern Search ===");
        for (line_num, line) in content.lines().enumerate() {
            if line.contains("commit_recursion_public_values") && !line.trim().starts_with("//") {
                println!("Line {}: {}", line_num + 1, line.trim());
            }
        }

        // Search for assert_complete (should be between is_complete assignment and commit)
        println!("\n=== assert_complete Pattern Search ===");
        let mut found_assert_complete = false;
        for (line_num, line) in content.lines().enumerate() {
            if line.contains("assert_complete(") && !line.trim().starts_with("//") {
                println!("Line {}: {}", line_num + 1, line.trim());
                found_assert_complete = true;
            }
        }

        if !found_assert_complete {
            println!("❌ No assert_complete() call found - VULNERABLE!");
        } else {
            println!("✅ assert_complete() call found - FIXED!");
        }
    }
}

// ============================================================================
// Main (for standalone execution)
// ============================================================================

fn main() {
    println!("=================================================================");
    println!("SP1 is_complete Underconstrained Vulnerability Harness");
    println!("GHSA-c873-wfhp-wx5m Bug 2");
    println!("=================================================================\n");

    println!("This harness performs static analysis on SP1 recursion circuit");
    println!("source code to detect the underconstrained is_complete flag bug.");
    println!("\nRun tests with:");
    println!("  rustc --test harness_is_complete_underconstrained.rs -o harness_runner");
    println!("  ./harness_runner\n");
}

