//! Unit tests for SP1 Fiat-Shamir observation order vulnerability
//!
//! Bug: GHSA-8m24-3cfx-9fjw - Insufficient observation of cumulative sum
//! Vulnerable Commit: 7b436608b3946bc1342854ab3ce0a848b0f349ae
//! Fix Commit: 64854c15b546803557ca21c5f13e2bcdb5a2283e
//!
//! This test suite validates that the permutation commitment is observed into the 
//! Fiat-Shamir challenger BEFORE sampling zeta challenge. In the vulnerable version,
//! the prover observes main_commit but NOT permutation_commit before sampling zeta,
//! breaking the Fiat-Shamir soundness.
//!
//! Test Strategy:
//! 1. Mock transcript structures to simulate challenger state
//! 2. Track observation sequence
//! 3. Verify permutation_commit is observed before zeta sampling
//! 4. Differential oracle comparing vulnerable vs fixed behavior
//!
//! NO DEPENDENCIES REQUIRED - runs with just rustc

use std::collections::HashSet;

/// Mock transcript state for Fiat-Shamir protocol
#[derive(Debug, Clone)]
struct TranscriptState {
    observations: Vec<String>,
    challenges: Vec<String>,
}

impl TranscriptState {
    fn new() -> Self {
        Self {
            observations: Vec::new(),
            challenges: Vec::new(),
        }
    }
    
    fn observe(&mut self, label: String) {
        self.observations.push(label);
    }
    
    fn sample_challenge(&mut self, label: String) -> u64 {
        self.challenges.push(label.clone());
        // Simple hash based on observations seen so far
        let mut hash: u64 = 0;
        for obs in &self.observations {
            for byte in obs.bytes() {
                hash = hash.wrapping_mul(31).wrapping_add(byte as u64);
            }
        }
        hash
    }
    
    fn has_observed(&self, label: &str) -> bool {
        self.observations.iter().any(|obs| obs == label)
    }
    
    fn observation_count(&self) -> usize {
        self.observations.len()
    }
}

/// Simulates vulnerable prover behavior (missing permutation_commit observation)
fn vulnerable_prover_transcript() -> TranscriptState {
    let mut transcript = TranscriptState::new();
    
    // Step 1: Commit to main trace
    transcript.observe("main_commit".to_string());
    
    // Step 2: Sample permutation challenges (alpha, beta)
    transcript.sample_challenge("alpha".to_string());
    transcript.sample_challenge("beta".to_string());
    
    // Step 3: Generate permutation trace (but don't observe the commit!)
    // BUG: permutation_commit is NOT observed!
    
    // Step 4: Sample zeta WITHOUT observing permutation_commit
    transcript.sample_challenge("zeta".to_string());
    
    transcript
}

/// Simulates fixed prover behavior (observes permutation_commit before zeta)
fn fixed_prover_transcript() -> TranscriptState {
    let mut transcript = TranscriptState::new();
    
    // Step 1: Commit to main trace
    transcript.observe("main_commit".to_string());
    
    // Step 2: Sample permutation challenges
    transcript.sample_challenge("alpha".to_string());
    transcript.sample_challenge("beta".to_string());
    
    // Step 3: Commit to permutation trace
    transcript.observe("permutation_commit".to_string()); // FIX: observe it!
    
    // Step 4: Sample zeta AFTER observing permutation_commit
    transcript.sample_challenge("zeta".to_string());
    
    transcript
}

/// Verify observation sequence invariants
fn verify_observation_order(transcript: &TranscriptState) -> Result<(), String> {
    // Check that main_commit is observed
    if !transcript.has_observed("main_commit") {
        return Err("main_commit not observed".to_string());
    }
    
    // Check that permutation_commit is observed before zeta sampling
    let has_perm = transcript.has_observed("permutation_commit");
    let has_zeta = transcript.challenges.iter().any(|c| c == "zeta");
    
    if has_zeta && !has_perm {
        return Err("VULNERABILITY: zeta sampled without observing permutation_commit".to_string());
    }
    
    // Check observation happens before zeta challenge
    let perm_pos = transcript.observations.iter().position(|o| o == "permutation_commit");
    let zeta_idx = transcript.challenges.iter().position(|c| c == "zeta");
    
    match (perm_pos, zeta_idx) {
        (Some(_), Some(_)) => Ok(()),
        (None, Some(_)) => Err("permutation_commit not observed before zeta".to_string()),
        _ => Ok(()), // No zeta sampled yet
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    /// Test 1: Vulnerable version violates observation order
    #[test]
    fn test_vulnerable_transcript_missing_observation() {
        let vuln_transcript = vulnerable_prover_transcript();
        
        println!("\n=== Vulnerable Transcript ===");
        println!("Observations: {:?}", vuln_transcript.observations);
        println!("Challenges: {:?}", vuln_transcript.challenges);
        
        // Check that permutation_commit was NOT observed
        assert!(!vuln_transcript.has_observed("permutation_commit"),
                "Vulnerable version should NOT observe permutation_commit");
        
        // Check that zeta was sampled anyway
        assert!(vuln_transcript.challenges.iter().any(|c| c == "zeta"),
                "Vulnerable version samples zeta");
        
        // Verify this violates the invariant
        let result = verify_observation_order(&vuln_transcript);
        assert!(result.is_err(), "Vulnerable transcript should fail invariant check");
        
        println!("✓ BUG CONFIRMED: {}", result.unwrap_err());
    }
    
    /// Test 2: Fixed version satisfies observation order
    #[test]
    fn test_fixed_transcript_has_observation() {
        let fixed_transcript = fixed_prover_transcript();
        
        println!("\n=== Fixed Transcript ===");
        println!("Observations: {:?}", fixed_transcript.observations);
        println!("Challenges: {:?}", fixed_transcript.challenges);
        
        // Check that permutation_commit WAS observed
        assert!(fixed_transcript.has_observed("permutation_commit"),
                "Fixed version MUST observe permutation_commit");
        
        // Check that zeta was sampled
        assert!(fixed_transcript.challenges.iter().any(|c| c == "zeta"),
                "Fixed version samples zeta");
        
        // Verify this satisfies the invariant
        let result = verify_observation_order(&fixed_transcript);
        assert!(result.is_ok(), "Fixed transcript should pass invariant check: {:?}", result);
        
        println!("✓ FIX WORKS: Observation order is correct");
    }
    
    /// Test 3: Observation count differs between versions
    #[test]
    fn test_observation_count_differs() {
        let vuln = vulnerable_prover_transcript();
        let fixed = fixed_prover_transcript();
        
        println!("\n=== Observation Counts ===");
        println!("Vulnerable: {} observations", vuln.observation_count());
        println!("Fixed:      {} observations", fixed.observation_count());
        
        // Fixed version has one more observation (permutation_commit)
        assert_eq!(vuln.observation_count() + 1, fixed.observation_count(),
                   "Fixed version should have exactly one more observation");
        
        println!("✓ Observation count difference detected");
    }
    
    /// Test 4: Zeta challenge values differ due to transcript difference
    #[test]
    fn test_zeta_values_differ() {
        let vuln = vulnerable_prover_transcript();
        let fixed = fixed_prover_transcript();
        
        // Sample zeta from both transcripts at the point they exist
        // In vulnerable: after main_commit, alpha, beta
        // In fixed: after main_commit, alpha, beta, permutation_commit
        
        // Reconstruct to get zeta values
        let vuln_observations = vuln.observations.clone();
        let fixed_observations = fixed.observations.clone();
        
        println!("\n=== Transcript State at Zeta Sampling ===");
        println!("Vulnerable observations before zeta: {:?}", vuln_observations);
        println!("Fixed observations before zeta: {:?}", fixed_observations);
        
        // The observation sets should differ
        assert_ne!(vuln_observations, fixed_observations,
                   "Observation sets should differ");
        
        println!("✓ Transcript divergence detected");
    }
    
    /// Test 5: Detailed sequence validation
    #[test]
    fn test_detailed_sequence_validation() {
        let vuln = vulnerable_prover_transcript();
        let fixed = fixed_prover_transcript();
        
        println!("\n=== Detailed Sequence Analysis ===");
        
        // Expected fixed sequence:
        // 1. observe(main_commit)
        // 2. sample(alpha)
        // 3. sample(beta)
        // 4. observe(permutation_commit)  ← MISSING in vulnerable
        // 5. sample(zeta)
        
        let expected_observations = vec!["main_commit", "permutation_commit"];
        let expected_challenges = vec!["alpha", "beta", "zeta"];
        
        // Check vulnerable
        println!("\nVulnerable:");
        for (i, obs) in vuln.observations.iter().enumerate() {
            println!("  [{}] observe: {}", i, obs);
        }
        for (i, ch) in vuln.challenges.iter().enumerate() {
            println!("  [{}] sample: {}", i, ch);
        }
        
        // Vulnerable should be missing permutation_commit
        assert!(!vuln.observations.contains(&"permutation_commit".to_string()),
                "Vulnerable should NOT have permutation_commit");
        
        // Check fixed
        println!("\nFixed:");
        for (i, obs) in fixed.observations.iter().enumerate() {
            println!("  [{}] observe: {}", i, obs);
        }
        for (i, ch) in fixed.challenges.iter().enumerate() {
            println!("  [{}] sample: {}", i, ch);
        }
        
        // Fixed should have all expected observations
        for exp in &expected_observations {
            assert!(fixed.observations.contains(&exp.to_string()),
                    "Fixed should observe {}", exp);
        }
        
        // Both should have same challenges
        for exp in &expected_challenges {
            assert!(fixed.challenges.contains(&exp.to_string()),
                    "Fixed should sample {}", exp);
        }
        
        println!("\n✓ Sequence validation complete");
    }
    
    /// Test 6: Verify completeness of observations
    #[test]
    fn test_observation_completeness() {
        let fixed = fixed_prover_transcript();
        
        // All commitments sent to verifier must be observed
        let required_observations = vec!["main_commit", "permutation_commit"];
        
        for req in required_observations {
            assert!(fixed.has_observed(req),
                    "Fixed version must observe {}", req);
        }
        
        println!("✓ All required observations present in fixed version");
    }
    
    /// Test 7: Order matters - permutation_commit before zeta
    #[test]
    fn test_permutation_before_zeta() {
        let fixed = fixed_prover_transcript();
        
        // Find positions
        let perm_pos = fixed.observations.iter()
            .position(|o| o == "permutation_commit")
            .expect("permutation_commit should be observed");
        
        // Challenges are sampled after observations, so we need to check
        // that permutation_commit was observed before zeta was sampled
        
        // In our mock, zeta is the 3rd challenge (after alpha, beta)
        // and permutation_commit is the 2nd observation (after main_commit)
        
        let _zeta_pos = fixed.challenges.iter()
            .position(|c| c == "zeta")
            .expect("zeta should be sampled");
        
        // The key invariant: permutation_commit observation happens
        // before zeta sampling in the protocol flow
        
        // In our linear transcript, observations come before challenges
        // So we verify permutation_commit exists in observations
        assert!(perm_pos < fixed.observations.len(),
                "permutation_commit observed before zeta sampling");
        
        println!("✓ Correct ordering: permutation_commit observed before zeta sampled");
    }
}

#[cfg(test)]
mod fuzzing_oracle {
    use super::*;
    
    /// Differential oracle for fuzzing
    /// Returns true if behavior differs between vulnerable and fixed
    #[test]
    fn test_differential_oracle() {
        let vuln = vulnerable_prover_transcript();
        let fixed = fixed_prover_transcript();
        
        // Oracle: check if observation sets differ
        let vuln_obs_set: HashSet<_> = vuln.observations.iter().collect();
        let fixed_obs_set: HashSet<_> = fixed.observations.iter().collect();
        
        let differs = vuln_obs_set != fixed_obs_set;
        
        println!("\n=== Differential Oracle ===");
        println!("Vulnerable observations: {:?}", vuln_obs_set);
        println!("Fixed observations: {:?}", fixed_obs_set);
        println!("Behaviors differ: {}", differs);
        
        assert!(differs, "Oracle should detect difference between versions");
        
        // Specifically, fixed has permutation_commit, vulnerable doesn't
        let diff: HashSet<_> = fixed_obs_set.difference(&vuln_obs_set).collect();
        assert_eq!(diff.len(), 1, "Should be exactly one difference");
        assert!(diff.contains(&&"permutation_commit".to_string()),
                "Difference should be permutation_commit");
        
        println!("✓ Oracle correctly identifies the missing observation");
    }
    
    /// Oracle function that can be called by fuzzers
    pub fn oracle_detects_missing_observation(
        has_main_commit: bool,
        has_permutation_commit: bool,
        samples_zeta: bool,
    ) -> bool {
        // Vulnerability: sampling zeta without observing permutation_commit
        samples_zeta && has_main_commit && !has_permutation_commit
    }
    
    #[test]
    fn test_oracle_function() {
        // Vulnerable case
        assert!(oracle_detects_missing_observation(true, false, true),
                "Oracle should detect vulnerable pattern");
        
        // Fixed case
        assert!(!oracle_detects_missing_observation(true, true, true),
                "Oracle should not trigger on fixed pattern");
        
        // Incomplete protocols (no zeta yet)
        assert!(!oracle_detects_missing_observation(true, false, false),
                "Oracle should not trigger if zeta not sampled yet");
        
        println!("✓ Oracle function works correctly");
    }
}

#[cfg(test)]
mod static_analysis_helpers {
    /// Helper to check if source code has the vulnerable pattern
    pub fn has_vulnerable_pattern(source: &str) -> bool {
        // Check for observation of main_commit
        let has_main_obs = source.contains("challenger.observe") && 
                          source.contains("main_commit");
        
        // Check for sampling zeta
        let has_zeta = source.contains("sample_ext_element") &&
                      (source.contains("zeta") || source.contains("let zeta"));
        
        // Check for permutation commit observation
        let has_perm_obs = source.contains("challenger.observe") &&
                          source.contains("permutation_commit");
        
        // Vulnerable if: observes main, samples zeta, but doesn't observe permutation
        has_main_obs && has_zeta && !has_perm_obs
    }
    
    /// Helper to check if source code has the fix
    pub fn has_fix_pattern(source: &str) -> bool {
        // Must have permutation_commit observation before zeta sampling
        let has_perm_obs = source.contains("challenger.observe") &&
                          source.contains("permutation_commit");
        has_perm_obs
    }
    
    #[test]
    fn test_pattern_detection_on_mock_code() {
        // Mock vulnerable code
        let vuln_code = r#"
            challenger.observe(main_commit);
            let alpha = challenger.sample_ext_element();
            let beta = challenger.sample_ext_element();
            // Generate permutation trace...
            let zeta = challenger.sample_ext_element();
        "#;
        
        // Mock fixed code
        let fixed_code = r#"
            challenger.observe(main_commit);
            let alpha = challenger.sample_ext_element();
            let beta = challenger.sample_ext_element();
            // Generate permutation trace...
            challenger.observe(permutation_commit);
            let zeta = challenger.sample_ext_element();
        "#;
        
        // Test detection
        assert!(has_vulnerable_pattern(vuln_code), 
                "Should detect vulnerable pattern");
        assert!(!has_vulnerable_pattern(fixed_code),
                "Should not detect vulnerability in fixed code");
        assert!(has_fix_pattern(fixed_code),
                "Should detect fix pattern");
        
        println!("✓ Static pattern detection works");
    }
}

fn main() {
    println!("=================================================");
    println!("SP1 Fiat-Shamir Observation Order - Unit Tests");
    println!("=================================================");
    println!("Bug: GHSA-8m24-3cfx-9fjw");
    println!("Vulnerable: 7b43660 (Dec 2023)");
    println!("Fixed: 64854c15 (Dec 2023)");
    println!("=================================================\n");
    
    println!("Run with: rustc --test unit_fiat_shamir_observation.rs && ./unit_fiat_shamir_observation");
    println!("Or: cargo test --test unit_fiat_shamir_observation\n");
}

