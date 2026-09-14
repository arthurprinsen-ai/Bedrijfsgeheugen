import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateMeetingProbability,
  MEETING_PROBABILITY_MODEL_CONTRACT,
} from './meeting-probability-model.mjs';

test('bootstraps transparently from opportunity score times confidence before enough outcomes exist',()=>{
  const estimate=estimateMeetingProbability({
    opportunityScore:80,
    confidence:.75,
    calibrationMetrics:{sample_size:4,calibration_bins:[]},
  });
  assert.equal(estimate.raw_probability,.6);
  assert.equal(estimate.probability,.6);
  assert.equal(estimate.source,'bootstrap_proxy');
  assert.equal(estimate.model_version,'meeting-probability-v1');
  assert.equal(estimate.calibration.sample_size,4);
  assert.equal(estimate.calibration.applied,false);
});

test('uses only a sufficiently populated matching calibration bin and shrinks empirical rate toward the raw estimate',()=>{
  const estimate=estimateMeetingProbability({
    opportunityScore:80,
    confidence:.75,
    calibrationMetrics:{
      sample_size:24,
      calibration_bins:[
        {min_probability:.5,max_probability:.6,sample_size:4,mean_predicted_probability:.55,actual_positive_rate:.25},
        {min_probability:.6,max_probability:.7,sample_size:10,mean_predicted_probability:.63,actual_positive_rate:.4},
      ],
    },
  });
  assert.equal(estimate.raw_probability,.6);
  assert.equal(estimate.source,'empirical_bin_calibration');
  assert.equal(estimate.calibration.bin_sample_size,10);
  assert.equal(estimate.calibration.reliability_weight,.5);
  assert.equal(estimate.probability,.5);
});

test('does not apply weak or unrelated calibration evidence',()=>{
  const weak=estimateMeetingProbability({
    opportunityScore:90,confidence:.8,
    calibrationMetrics:{sample_size:30,calibration_bins:[{min_probability:.7,max_probability:.8,sample_size:3,actual_positive_rate:.1}]},
  });
  assert.equal(weak.raw_probability,.72);
  assert.equal(weak.probability,.72);
  assert.equal(weak.source,'bootstrap_proxy');
  assert.equal(weak.calibration.applied,false);

  const unrelated=estimateMeetingProbability({
    opportunityScore:40,confidence:.5,
    calibrationMetrics:{sample_size:30,calibration_bins:[{min_probability:.7,max_probability:.8,sample_size:20,actual_positive_rate:.9}]},
  });
  assert.equal(unrelated.raw_probability,.2);
  assert.equal(unrelated.probability,.2);
});

test('fails closed on absent or invalid decision inputs',()=>{
  assert.throws(()=>estimateMeetingProbability({opportunityScore:null,confidence:.8}),/opportunityScore/);
  assert.throws(()=>estimateMeetingProbability({opportunityScore:101,confidence:.8}),/opportunityScore/);
  assert.throws(()=>estimateMeetingProbability({opportunityScore:80,confidence:null}),/confidence/);
  assert.throws(()=>estimateMeetingProbability({opportunityScore:80,confidence:1.2}),/confidence/);
});

test('contract makes bootstrap and calibration thresholds explicit',()=>{
  assert.equal(MEETING_PROBABILITY_MODEL_CONTRACT.version,'MEETING-PROBABILITY-v1');
  assert.equal(MEETING_PROBABILITY_MODEL_CONTRACT.minimumCalibrationSamples,10);
  assert.equal(MEETING_PROBABILITY_MODEL_CONTRACT.minimumBinSamples,5);
  assert.equal(MEETING_PROBABILITY_MODEL_CONTRACT.priorStrength,10);
  assert.equal(MEETING_PROBABILITY_MODEL_CONTRACT.manualCallerProbabilityAuthoritative,false);
});
