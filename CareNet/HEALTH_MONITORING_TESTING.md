# Health Monitoring Features - Testing Guide

## Quick Start Testing

### Prerequisites
- Open the CareNet application in a browser
- Clear browser cache to start fresh
- Have both family member and volunteer accounts ready

---

## Test Case 1: Create Health Profile

**Objective**: Verify family members can create and view health profiles

**Steps**:
1. Login as: **jane** / **password** / **elderly** (family role)
2. Navigate to **Family Dashboard**
3. Scroll to **Health Profile** section
4. Click **"Create Health Profile"** button
5. Fill in the form with sample data:
   - Age: `75`
   - Blood Type: `O+`
   - Conditions: `Diabetes, Hypertension, Arthritis`
   - Medications: 
     ```
     Metformin - 500mg twice daily
     Lisinopril - 10mg daily
     Aspirin - 81mg daily
     ```
   - Allergies: `Penicillin, Shellfish`
   - Check: ✓ Limited Mobility, ✓ Fall Risk
6. Click **"Save Profile"** button
7. Verify success message appears
8. ** Expected Result**: 
   - Health profile displays with:
   - Risk Score: 75/100 or higher (Critical Risk ⚠️)
   - All entered conditions displayed
   - Medication list shown
   - Allergies highlighted
   - Limitation icons displayed

---

## Test Case 2: Risk Score Calculation

**Objective**: Verify health risk score is calculated correctly

**Expected Risk Scores**:
- Age 75, no conditions, no medications, no allergies: **~4-8** (Low 🟢)
- Age 65, 2 conditions, 3 medications: **~25-30** (Moderate 🟡)
- Age 85, 4 conditions, 5 medications, fall risk: **~55-65** (High 🔴)
- Age 80, chronic conditions, mobility issues, fall risk: **75+** (Critical ⚠️)

**Test Instructions**:
1. Create multiple health profiles with different data
2. Verify risk score updates accordingly
3. Verify color changes (green → yellow → red → orange)
4. Note: Risk label should match score range

---

## Test Case 3: Accept Medical Service and View Health Info

**Objective**: Verify volunteers see health information for health-related services

**Setup**:
1. Login as **jane** (family) - have health profile created
2. Request a **Medical Appointment** service:
   - Service: Medical Appointment
   - Date: Tomorrow
   - Time: 10:00 AM
   - Address: 123 Main St
3. Logout and login as **john** / **password** / **volunteer**

**Steps**:
1. Navigate to **Volunteer Dashboard**
2. In **Available Tasks** section, find jane's Medical Appointment request
3. Click **"Details"** button
4. Verify modal shows:
   - Service User Information
   - Health Profile Summary
   - Health Risk Score
   - Chronic Conditions
   - Allergies
5. Close modal, click **"Accept"** button
6. In **My Tasks** section, verify task now shows:
   - Service user info
   - Health risk score (yellow info box)
   - All chronic conditions
   - Allergies

**Expected Result**: ✅ All health information clearly visible

---

## Test Case 4: Record Health Observation

**Objective**: Verify volunteers can record health observations

**Steps**:
1. Login as **john** (volunteer)
2. Navigate to **My Tasks**
3. Find a **Medical Appointment** task (accepted status)
4. Click **"📝 Record Observation"** button
5. Fill in Observation Form:
   - Category: **Physical Condition**
   - Details: **Patient appeared alert and responsive. Normal breathing. No signs of distress.**
   - Severity: **Normal**
   - Temperature: **98.6**
   - Blood Pressure: **120/80**
6. Click **"Save Observation"** button
7. Verify success message

**Then as Family Member**:
1. Logout and login as **jane** (family)
2. Navigate to **Family Dashboard**
3. Scroll to **Health Observations** section
4. Verify observation appears with:
   - Category: Physical Condition
   - Your recorded details
   - Severity: Normal
   - Date and time
   - Recorded by: john

**Expected Result**: ✅ Observation recorded and displays correctly

---

## Test Case 5: Multiple Observations History

**Objective**: Verify observation history accumulates and displays correctly

**Steps**:
1. (As john) Record 3-5 different observations:
   - Different categories each time
   - Different severity levels
   - Include vital signs for some
2. (As jane) Check Health Observations section
3. Verify observations display in reverse chronological order (newest first)
4. Verify all observations have date/time stamps
5. Verify recorder names are shown

**Expected Result**: ✅ All observations display correctly in chronological order

---

## Test Case 6: Health Alerts Display

**Objective**: Verify health alerts from profile display to volunteers

**Prerequisite**: Health profile with allergies created

**Steps**:
1. Create or verify health profile includes allergies (e.g., "Penicillin")
2. Login as volunteer (john)
3. View a Medical Service task for this person
4. Scroll down in task details
5. Look for **health alerts** section (red box with warning icon)
6. Verify alerts show allergies and other health concerns

**Expected Result**: ✅ Health alerts clearly visible in red box

---

## Test Case 7: Only Medical Services Show Observations

**Objective**: Verify observation recording only appears for health-related services

**Setup**: Create requests for different service types

**Steps**:
1. Create and accept services:
   - Medical Appointment (should show "Record Observation")
   - Medication Management (should show "Record Observation")
   - Personal Care (should show "Record Observation")
   - Shopping & Errands (should NOT show "Record Observation")
   - Companionship (should NOT show "Record Observation")
2. For each task, verify observation button presence/absence

**Expected Result**: ✅ Button appears only for medical-related services

---

## Test Case 8: Health Profile Locked After Creation

**Objective**: Verify health profiles cannot be edited after creation

**Steps**:
1. Login as family member with existing health profile
2. Scroll to Health Profile section
3. Try to create another profile or click edit
4. Verify error message: "Health profile has been saved and cannot be edited"
5. Verify no edit functionality is available

**Expected Result**: ✅ Profile locked; user directed to support for updates

---

## Test Case 9: Data Persistence

**Objective**: Verify health data persists across page refreshes

**Steps**:
1. Create health profile and record observations
2. Refresh the page (F5 or Cmd+R)
3. Login again if needed
4. Navigate back to dashboard
5. Verify health profile is still there
6. Verify observations are still there

**Expected Result**: ✅ All data persists across refresh

---

## Test Case 10: Different Users See Different Data

**Objective**: Verify data isolation between users

**Setup**: Multiple user accounts with different health data

**Steps**:
1. Login as **jane**
   - Create health profile
   - Verify only jane's data shows
2. Logout and login as **sarah** (different family member)
   - Check health profile section (should be empty)
3. Logout and login as **john** (volunteer)
   - Accept a task from jane
   - Verify can see jane's health data for that task
   - Accept a task from sarah
   - Verify sees sarah's health data (if exists)
   - Verify data is task-specific

**Expected Result**: ✅ Each user sees only their own/relevant data

---

## Test Case 11: Empty/Minimal Health Profile

**Objective**: Verify system handles incomplete health data gracefully

**Steps**:
1. Create health profile with minimal data:
   - Age: 70
   - Leave other fields empty
2. Verify profile displays with available data
3. Verify risk score still calculates (should be low)
4. Login as volunteer accepting task
5. Verify health information displays gracefully with "Not provided" messages

**Expected Result**: ✅ System handles incomplete data without errors

---

## Test Case 12: Multiple Observations Pagination

**Objective**: Verify observations list handles many items

**Steps**:
1. Record 10+ observations for same service user
2. Login as family member
3. Check Health Observations section
4. Verify displays cleanly
5. Check if pagination appears (if implemented)
6. Verify latest observations visible at top

**Expected Result**: ✅ Large observation lists display properly

---

## Performance Tests

### Test Performance - Profile Rendering
1. Create complex health profile with many conditions/medications
2. Time how long profile section takes to render
3. **Expected**: < 100ms

### Test Performance - Observations List
1. Load page with 50+ observations
2. Check dashboard responsiveness
3. **Expected**: No noticeable lag

---

## Edge Cases

### Test Case: Special Characters in Data
- Conditions: "Alzheimer's, Parkinson's"
- Medications: "Rx: Drug-Name (brand)"
- Expected: ✅ Displays correctly without formatting issues

### Test Case: Very Long Observations
- Enter detailed observation with 500+ characters
- Expected: ✅ Displays in textarea without truncation

### Test Case: Multiple Alerts
- Create profile with 5+ allergies/conditions
- Expected: ✅ All display without overflow

---

## Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Checklist for QA Sign-Off

- [ ] Health profiles create successfully
- [ ] Risk scores calculate correctly
- [ ] Risk levels display with correct colors
- [ ] Volunteers see health info for medical services
- [ ] Observations record and display
- [ ] Data persists across refreshes
- [ ] Data isolation works correctly
- [ ] No console errors
- [ ] Responsive design works on mobile
- [ ] Forms validate properly
- [ ] All alerts display correctly
- [ ] Performance acceptable

---

## Common Issues & Fixes

### Issue: Health profile not appearing
**Solution**: 
- Check browser console for errors (F12)
- Verify localStorage is enabled
- Clear cache and reload

### Issue: Observations not saving
**Solution**:
- Ensure all required fields filled
- Check browser console
- Verify request ID is set correctly

### Issue: Health alerts not showing
**Solution**:
- Verify health profile created first
- Make sure task is medical-related
- Check risk score is > 0

### Issue: Data disappearing after refresh
**Solution**:
- Check if browser is in private/incognito mode (localStorage disabled)
- Verify localStorage available in browser settings
- Check storage quota not exceeded

---

## Test Data Suggestions

### High Risk Profile:
```
Age: 82
Blood Type: A+
Conditions: Diabetes, Hypertension, Heart Disease, Arthritis, Dementia
Medications:
  Metformin - 1000mg twice daily
  Lisinopril - 20mg daily
  Atorvastatin - 40mg daily
  Aspirin - 81mg daily
  Donepezil - 10mg at bedtime
Allergies: Penicillin, Sulfonamides, Shellfish
Limitations: ✓ Mobility, ✓ Fall Risk, ✓ Cognitive Issues, ✓ Recent Hospitalization
```
**Expected Result**: Risk Score 85-95 (Critical ⚠️)

### Low Risk Profile:
```
Age: 65
Blood Type: O+
Conditions: (empty)
Medications: (empty)
Allergies: (empty)
Limitations: None checked
```
**Expected Result**: Risk Score 0-5 (Low 🟢)

---

## Reporting Test Results

When reporting issues, include:
- [ ] Browser and version
- [ ] Steps to reproduce
- [ ] Expected vs actual result
- [ ] Screenshot/video if applicable
- [ ] Browser console errors (if any)
- [ ] Data used in test

---

**Test Plan Version**: 1.0
**Last Updated**: 2024-Q1
**Status**: Ready for QA Testing
