import test from 'node:test';
import assert from 'node:assert/strict';
import {selectExternalTopics} from '../supabase/functions/bg-externe-signalen/topic-selection.mjs';

const DAY=86400000;
const time=Date.parse('2026-10-25T06:10:00Z');
const topics=Array.from({length:44},(_,i)=>({onderwerp:'topic:'+i,zoekvraag:'query:'+i}));
