# SageMath script to generate valid input.json for ResultCommitmentVerifier(1)

# Parameters
num_vote_options = 5  # Number of vote options
current_results = [0, 1, 2, 3, 4]  # Example current results
new_results = [1, 2, 3, 4, 5]  # Example new results
current_spent_voice_credit_subtotal = 10  # Example subtotal
new_spent_voice_credit_subtotal = 15  # Example new subtotal
current_per_vo_spent_voice_credits = [2, 3, 4, 5, 6]  # Example per vote option
new_per_vo_spent_voice_credits = [3, 4, 5, 6, 7]  # Example new per vote option
current_results_root_salt = 12345  # Example salt
new_results_root_salt = 67890  # Example new salt
current_spent_voice_credit_subtotal_salt = 11111  # Example salt
new_spent_voice_credit_subtotal_salt = 22222  # Example new salt
current_per_vo_spent_voice_credits_root_salt = 33333  # Example salt
new_per_vo_spent_voice_credits_root_salt = 44444  # Example salt
is_first_batch = 1  # 1 if this is the first batch

# Calculate commitments
current_tally_commitment = 0  # Should be 0 for the first batch
new_tally_commitment = sum(new_results)  # Example calculation for new tally commitment

# Create the input dictionary with standard Python integers
input_data = {
    "isFirstBatch": int(is_first_batch),
    "currentTallyCommitment": int(current_tally_commitment),
    "newTallyCommitment": int(new_tally_commitment),
    "currentResults": [int(x) for x in current_results],
    "currentResultsRootSalt": int(current_results_root_salt),
    "newResults": [int(x) for x in new_results],
    "newResultsRootSalt": int(new_results_root_salt),
    "currentSpentVoiceCreditSubtotal": int(current_spent_voice_credit_subtotal),
    "currentSpentVoiceCreditSubtotalSalt": int(current_spent_voice_credit_subtotal_salt),
    "newSpentVoiceCreditSubtotal": int(new_spent_voice_credit_subtotal),
    "newSpentVoiceCreditSubtotalSalt": int(new_spent_voice_credit_subtotal_salt),
    "currentPerVOSpentVoiceCredits": [int(x) for x in current_per_vo_spent_voice_credits],
    "currentPerVOSpentVoiceCreditsRootSalt": int(current_per_vo_spent_voice_credits_root_salt),
    "newPerVOSpentVoiceCredits": [int(x) for x in new_per_vo_spent_voice_credits],
    "newPerVOSpentVoiceCreditsRootSalt": int(new_per_vo_spent_voice_credits_root_salt),
}

# Write to input.json
with open('input.json', 'w') as f:
    import json
    json.dump(input_data, f, indent=4)

print("input.json generated successfully.")