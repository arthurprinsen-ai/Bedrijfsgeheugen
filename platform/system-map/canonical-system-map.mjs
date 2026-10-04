export const POWERHOUSE_SYSTEM_MAP = Object.freeze({
  version:'powerhouse-live-system-map-v2',
  fingerprint:'powerhouse-canonical-system-map-agent-update-contract-v1',
  observedAt:'2026-09-30T19:24:00Z',
  notionAuthority:Object.freeze({
    workspaceId:'950da36a-ac8a-816b-ac6e-0003f91dfb3d',
    systemMapPageId:'3dcda36a-ac8a-8152-be3d-edbb32b06239',
    humanHandbookPageId:'3dcda36a-ac8a-81ac-aad1-c88751e9e814',
    masterRegisterPageId:'3c3da36a-ac8a-81dd-a3fe-c4fc12bba5df',
    latestVerifiedState:'Powerhouse Latest Verified State',
    agentActivityLog:'Powerhouse Agent Activity Log'
  }),
  sources:Object.freeze([
    Object.freeze({id:'github',label:'GitHub',role:'Code, policies, skills, tests, workflows, migrations, delivery evidence',authority:true}),
    Object.freeze({id:'netlify',label:'Netlify',role:'Website, Portal V2, Identity, thin API boundary, production deploy/readback',authority:true}),
    Object.freeze({id:'supabase',label:'Supabase',role:'Canonical runtime, Postgres, RLS, Edge Functions, cron, operating loop, evidence, outcomes, learning',authority:true}),
    Object.freeze({id:'notion',label:'Notion',role:'Human-readable System Map, handbook, current state, activity log and verified-state projection',authority:true}),
    Object.freeze({id:'portal',label:'Portal V2',role:'Human control surface over canonical runtime truth',authority:false}),
    Object.freeze({id:'external',label:'External providers',role:'Buffer, DataForSEO, Tavily, Google, OpenArt and future connectors; provider truth/readback',authority:false})
  ]),
  intelligenceLayers:Object.freeze([
    Object.freeze({id:'evidence',label:'Evidence & provenance',purpose:'Observed facts, source identity, freshness, confidence and evidence refs'}),
    Object.freeze({id:'knowledge',label:'Knowledge & memory',purpose:'Documents, context, canonical state, reusable learning and lineage'}),
    Object.freeze({id:'graph',label:'Company, execution & capability graph',purpose:'Typed people, company, opportunity, action, outcome, dependency, capability, system and owner relations with canonical lineage'}),
    Object.freeze({id:'semantics',label:'Semantic intelligence',purpose:'Normalize meaning across sources, domains, entities and events'}),
    Object.freeze({id:'signals',label:'Signals & external intelligence',purpose:'Market, SEO, regulation, analytics, provider and customer signals'}),
    Object.freeze({id:'prediction',label:'Prediction & foresight',purpose:'Forecasts, opportunity prediction, scenario and calibration'}),
    Object.freeze({id:'impact',label:'Impact & value intelligence',purpose:'Expected and realized value, cost, CO2e, water, risk and ROI'}),
    Object.freeze({id:'decision',label:'Decision intelligence',purpose:'Priority, next-best-action, constraints and explainable recommendations'}),
    Object.freeze({id:'agents',label:'Agent fabric',purpose:'Route work to agents, bounded execution, collaboration, recovery and self-heal'}),
    Object.freeze({id:'delivery',label:'Delivery intelligence',purpose:'PR, CI, exact-head gates, protected merge, deploy and production readback'}),
    Object.freeze({id:'learning',label:'Learning & prevention',purpose:'Root cause, failed approaches, regression, prevention and skill projection'}),
    Object.freeze({id:'self-improvement',label:'Self-improvement & evals',purpose:'Agent objectives, provider-neutral model routing, architecture health, candidate evaluation, controlled promotion and learning compilation'}),
    Object.freeze({id:'governance',label:'Trust, security & compliance',purpose:'Auth, RLS, admin boundaries, AI governance, evidence coverage and controls'}),
    Object.freeze({id:'resource',label:'Resource & sustainability',purpose:'Costs, credits, compute, storage, bandwidth, energy/CO2e/water proxies and efficiency'})
  ]),
  runtimeCapabilities:Object.freeze([
    Object.freeze({
      id:'prewrite-obligation-external-mutation-recovery-v1',
      fingerprint:'powerhouse|prewrite-obligation|external-mutation-recovery|v1',
      label:'Pre-write Obligation & External Mutation Recovery',
      authority:'github+supabase+provider-readback',
      owner:'whole-brain-reliability',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['expected outcome','canonical obligation','idempotency key','planned external mutation']),
      outputs:Object.freeze(['durable pre-write checkpoint','same-lineage recovery','terminal readback or hard-boundary evidence']),
      runtime:Object.freeze({
        continuityPolicy:'brain/policies/powerhouse-agent-continuity-v1.json',
        agentContract:'AGENTS.md',
        skill:'.agents/skills/powerhouse-continuity/SKILL.md',
        obligationContract:'docs/outcome-obligations.md',
        contentOrchestrator:'supabase/functions/powerhouse-content-orchestrator/index.ts'
      }),
      invariants:Object.freeze({
        obligationBeforeExternalWrite:true,
        blockedWriteIsRecoverable:true,
        sameIdempotencyLineage:true,
        blogClosesOnProductionReadback:true,
        linkedinCompanyReadAclNotWritePrerequisite:true,
        durableProviderUrnStopsRepublish:true
      })
    }),
    Object.freeze({
      id:'powerhouse-product-led-growth-v1',
      label:'Powerhouse Product-led Growth Architecture',
      authority:'github+public-site+growth-evidence',
      owner:'Powerhouse Growth & Revenue OS',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['public product proposition','existing capabilities','conversion entry points','integration trust','commercial outcomes']),
      outputs:Object.freeze(['single platform narrative','Intelligence product line','Agents product line','Connect product line','free-to-product conversion path']),
      runtime:Object.freeze({homepageBuilder:'tools/site-shell/apply-product-led-home.mjs',skill:'skills/powerhouse-product-led-growth.md',regression:'tests/product-led-home-v1.test.mjs',learning:'brain/learning/2026-09-30-powerhouse-product-led-home-v1.json'}),
      invariants:Object.freeze({onePlatformTaxonomy:true,productBeforeConsultancy:true,freeEntryVisible:true,selfServicePathRequired:true,unverifiedScaleClaimsForbidden:true,bilingualParityRequired:true})
    }),
    Object.freeze({
      id:'predictive-multi-agent-delivery-scheduler-v1',
      label:'Predictive Multi-Agent Delivery Scheduler',
      authority:'github+canonical-delivery-policy',
      owner:'whole-brain-reliability',
      status:'ACTIVE_PROVEN',
      inputs:Object.freeze(['obligation','candidate head','main epoch','changed paths','conflict contracts','mutable resources','active candidates','queue pressure','predicted fan-out']),
      outputs:Object.freeze(['parallel-build decision','canonical writer decision','terminal serialization decision','resumable async checkpoint']),
      runtime:Object.freeze({scheduler:'tools/delivery/predictive-controller.mjs#planConcurrentAgentWork',checkpoint:'POWERHOUSE-ASYNC-CHECKPOINT-v1',policy:'brain/policies/powerhouse-agent-continuity-v1.json'}),
      productionEvidence:Object.freeze({mergeSha:'c2188fde24f7d51c194acd1c7c0d093b7ceb316e',requiredTest:'success',skillProjection:'success',canonicalTerminalizerRunId:36696171917,canonicalTerminalizerConclusion:'success',productionMode:'MAIN_CONTAINMENT_NON_RUNTIME'}),
      invariants:Object.freeze({oneObligationOneWriter:true,nonConflictingParallelBuild:true,serializeOnlyTerminalOverlap:true,predictFanoutBeforeWrite:true,remoteWaitNeverMeansStop:true})
    }),
    Object.freeze({
      id:'async-delivery-continuation-v1',
      label:'Async Delivery Continuation & Queue Supersession',
      authority:'github+powerhouse-canonical-checkpoint',
      owner:'whole-brain-reliability',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['open obligation','exact candidate head','current main epoch','GitHub/Netlify/Supabase workflow state']),
      outputs:Object.freeze(['resumable checkpoint','deduplicated required runs','bounded polling','stale reversible run supersession']),
      runtime:Object.freeze({
        policy:'brain/policies/powerhouse-agent-continuity-v1.json',
        agentContract:'AGENTS.md',
        skill:'.agents/skills/powerhouse-continuity/SKILL.md',
        productionSnapshot:'.github/workflows/production-source-snapshot.yml',
        requiredGate:'.github/workflows/required-test.yml',
        recoverySupervisor:'.github/workflows/powerhouse-delivery-recovery-supervisor.yml',
        learning:'brain/learning/2026-09-30-async-workflow-continuation-v1.json'
      }),
      invariants:Object.freeze({
        remoteWaitNeverMeansAgentIdle:true,
        duplicateRequiredRunForbidden:true,
        boundedPollingRequired:true,
        checkpointBeforeWait:true,
        requiredOnlyOpenPrRecovery:true,
        staleReversibleProductionWaitSupersededByNewerMain:true
      })
    }),
    Object.freeze({
      id:'ai-model-intelligence-advisor-v1',
      label:'AI Model Intelligence & Advisor',
      authority:'github+official-provider-evidence+supabase-commercial-outcomes',
      owner:'Powerhouse Growth & Revenue OS / whole-brain-intelligence',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['official provider model/pricing/lifecycle/governance evidence','plain-language business outcome','one-off vs recurring cadence','number of users/employees','estimated workload volume','data sensitivity','error impact','integration pattern','budget','cost/latency/quality priority','privacy/residency/sovereignty constraints']),
      outputs:Object.freeze(['explainable model shortlist','task-cost estimate','multi-model routing recommendation','qualified lead context','model-intelligence learning']),
      runtime:Object.freeze({providerGovernance:'data/ai-provider-governance-v1.json',
        catalog:'data/ai-model-catalog-v1.json',
        policy:'config/powerhouse-ai-model-intelligence-v1.json',
        publicSurface:'/ai-modelwijzer',
        leadFunction:'netlify/functions/ai-modelwijzer-lead.mjs',
        skill:'.agents/skills/powerhouse-ai-model-intelligence/SKILL.md',
        learning:'brain/learning/2026-09-30-powerhouse-ai-model-advisor-v1.json',
        regression:'tests/ai-model-advisor-v1.test.mjs',
        dailyAudit:'scripts/brain/ai-model-intelligence-audit.mjs',
        dailyWorkflow:'.github/workflows/powerhouse-daily-self-evolution.yml'
      }),
      invariants:Object.freeze({
        userGoalFirst:true,
        noUniversalBestModelClaim:true,
        dataResidencyIsNotSovereignty:true,
        storageAndInferenceResidencySeparated:true,
        providerJurisdictionExplicit:true,
        officialSourceFirst:true,
        unknownIsNotGuaranteed:true,
        valueBeforeLeadGate:true,
        noParallelLeadStore:true,
        qualifiedLeadToRevenueLoop:true,
        protectedDeliveryAndProductionReadbackRequired:true,
        specialistIntentGate:true,
        explicitLimitationsRequired:true,
        modalityAndTaskFiltersRequired:true,
        perModelVerificationDateRequired:true,
        governanceUnknownNeverGreen:true,
        broadSpecialistCoverage:true,
        falconOpenWeightCoverageRequired:true,
        noviceOutcomeFirstWizard:true,
        unknownAnswerStillActionable:true,
        employeeAndCadenceScaleCost:true,
        errorImpactDrivesHumanControl:true,
        plainLanguageRecommendationRequired:true
      })
    }),
    Object.freeze({
      id:'social-story-family-uniqueness-v6',
      label:'Social Historical Story-Family Uniqueness v6',
      authority:'supabase',
      owner:'social-publication-authority',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['final social candidate','retained publication history','canonical story fingerprint','meaningful-keyword set']),
      outputs:Object.freeze(['UNIQUE_RESERVED','STORY_FAMILY_DUPLICATE','provider-write fence']),
      runtime:Object.freeze({
        reservation:'public.powerhouse_reserve_unique_publication_v1',
        backstop:'public.powerhouse_publication_story_family_guard_v2',
        history:'public.powerhouse_publication_uniqueness_v1',
        publisher:'supabase/functions/powerhouse-social-publisher/index.ts',
        skill:'.agents/skills/linkedin-composio-publisher/SKILL.md',
        personalSkill:'.agents/skills/personal-linkedin-life-only/SKILL.md',
        regression:'tests/brain-social-duplicate-prevention-governance-v1.test.mjs',
        learning:'brain/learning/2026-09-30-social-story-family-dedupe-v6.json'
      }),
      productionEvidence:Object.freeze({
        escapedDefect:'2026-09-24 vs 2026-09-30 personal LinkedIn car/sliding-door/airco story',
        sharedMeaningfulKeywords:16,
        priorJaccardApprox:0.165,
        observedOverlapAgainstSmallerStoryApprox:0.372,
        paraphraseRegressionBlocked:true,
        regressionResult:'STORY_FAMILY_DUPLICATE',
        observedAt:'2026-09-30T07:15:00+02:00'
      }),
      invariants:Object.freeze({
        databaseEnforced:true,
        applicationBypassForbidden:true,
        storyRewriteIsNotNovelty:true,
        overlapCoefficientGate:true,
        userReportedDuplicateBecomesRegression:true,
        consumedStoryFamilyNeverReactivatedByRewording:true
      })
    }),
    Object.freeze({
      id:'linkedin-company-growth-v1',
      label:'LinkedIn Company Page Growth Loop',
      authority:'supabase+provider-readback',
      owner:'Powerhouse Growth & Revenue OS',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['company-page analytics','linkedin_company posts','observed social metrics','owned-site and revenue outcomes']),
      outputs:Object.freeze(['distribution-gap diagnosis','bounded company-content recommendations','page/follower progress','revenue-learning evidence']),
      runtime:Object.freeze({
        policy:'config/linkedin-company-growth-v1.json',
        refresh:'public.powerhouse_refresh_linkedin_company_growth_v1(date)',
        pageMetrics:'public.powerhouse_linkedin_company_page_metrics_v1',
        dailyState:'public.powerhouse_linkedin_company_growth_daily_v1',
        recommendations:'public.powerhouse_content_recommendations',
        schedulerOwner:'public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)',
        skill:'.agents/skills/powerhouse-linkedin-company-growth/SKILL.md',
        learning:'brain/learning/2026-10-04-linkedin-company-page-growth-v1.json',
        regression:'tests/linkedin-company-growth-engine-v1.test.mjs'
      }),
      productionEvidence:Object.freeze({
        baselineObservedAt:'2026-10-04T13:11:00+02:00',
        baselinePageViews:12,
        baselineDesktop:10,
        baselineMobile:2,
        targetPageViews30d:300,
        targetRelevantNewFollowers30d:100
      }),
      invariants:Object.freeze({
        canonicalOrganizationUrn:'urn:li:organization:18234216',
        oneCommercialScheduler:true,
        maxCompanyPostsPerDay:1,
        maxGrowthRecommendationsPerDay:3,
        personalLinkedinCommercialBridgeForbidden:true,
        duplicateGateRequired:true,
        sourceBackedRequired:true,
        providerReadbackRequired:true,
        vanityMetricsNotTerminal:true,
        revenueNorthStar:true
      })
    }),
    Object.freeze({
      id:'source-backed-outbound-loop-v1',
      label:'Powerhouse Source-backed Outbound Loop',
      authority:'supabase+provider-readback',
      owner:'Powerhouse Growth & Revenue OS',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['public problem signals','SEO/search intent','verified personal truth','account/company triggers','relationship context','reply learning']),
      outputs:Object.freeze(['channel-native candidates','source-gated email/LinkedIn DM','provider-linked publication/send evidence','outcome/learning writeback']),
      runtime:Object.freeze({
        contract:'config/powerhouse-source-backed-channel-contract-v1.json',
        sourceLineage:'public.powerhouse_outbound_source_lineage_v1',
        materializer:'public.powerhouse_materialize_source_backed_channel_candidates_v1(date)',
        sourceGate:'public.powerhouse_require_source_for_direct_outreach_v1()',
        lineageRefresh:'public.powerhouse_refresh_outbound_source_lineage_v1(date)',
        orchestrator:'supabase/functions/powerhouse-content-orchestrator/index.ts',
        channels:Object.freeze(['linkedin_personal','linkedin_company','blog','email','linkedin_dm','instagram_company'])
      }),
      productionEvidence:Object.freeze({
        orchestratorVersion:29,
        lineageRefreshVerified:true,
        refreshedLineages:61,
        tomorrowLinkedinCompanySourceBacked:true,
        tomorrowBlogSourceBacked:true,
        directOutreachSourceGateActive:true,
        instagramSourceRadarSignals:24,
        instagramSourceRadarEligible:12,
        observedAt:'2026-09-29T19:10:00Z'
      }),
      invariants:Object.freeze({
        staticCalendarFallbackOnly:true,
        channelNativeTransformation:true,
        inventedPersonalExperienceForbidden:true,
        directOutreachRequiresTraceableTrigger:true,
        directOutreachRequiresPersonOrCompanyContext:true,
        providerReadbackRequired:true,
        outcomeLearningRequired:true,
        sameSourceLineagePreserved:true
      })
    }),
    Object.freeze({
      id:'instagram-live-provider-identity',
      label:'Instagram Live Provider Identity',
      authority:'composio-provider-readback',
      owner:'social-publication-authority',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['active Instagram connections','INSTAGRAM_GET_USER_INFO(me)','canonical username bedrijfsgeheugen.nl']),
      outputs:Object.freeze(['verified providerUserId','BUSINESS/CREATOR identity','create→publish→readback binding']),
      runtime:Object.freeze({
        publisher:'supabase/functions/powerhouse-social-publisher/index.ts',
        contract:'config/instagram-canonical-provider-identity-v3.json',
        skill:'.agents/skills/instagram-composio-publisher/SKILL.md',
        learning:'brain/learning/2026-09-29-instagram-provider-id-drift-v3.json'
      }),
      productionEvidence:Object.freeze({
        username:'bedrijfsgeheugen.nl',
        accountType:'BUSINESS',
        providerNodeId:'28537384955950341',
        observedGraphUserId:'17841446582493753',
        liveMediaId:'18105956765257858',
        livePermalink:'https://www.instagram.com/reel/Dd4MOdTEarq/',
        providerReadback:true,
        observedAt:'2026-09-29T16:29:48Z',
        edgeFunctionVersion:84,
        protectedMain:'8288b2ab5c6d7caa75a0e199d0273386776a66c2',
        directProviderReadback:true
      }),
      invariants:Object.freeze({
        hardcodedProviderUserIdForbidden:true,
        nodeIdDistinctFromGraphUserId:true,
        liveProviderIdentityBeforeSideEffect:true,
        liveGraphUserIdIsRuntimeAuthority:true,
        sameProviderUserIdForCreatePublishReadback:true,
        sameDailyClaimOnDrift:true
      })
    }),
    Object.freeze({
      id:'email-reply-revenue-learning-v1',
      label:'Commercial Email Reply → Revenue Learning',
      authority:'gmail+supabase',
      owner:'Powerhouse Growth & Revenue OS / powerhouse-commercial-learning-v1',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['executed autonomous email actions','Gmail provider readback','inbound replies','sales outcomes','realized revenue']),
      outputs:Object.freeze(['reply classification','suppression or deduplicated follow-up','sales outcome','revenue-first learning','next-best-action calibration']),
      runtime:Object.freeze({
        replies:'public.powerhouse_email_reply_events',
        suppressions:'public.powerhouse_email_contact_suppressions',
        learning:'public.powerhouse_email_learning_stats',
        learningRefresh:'public.powerhouse_refresh_email_learning_stats()',
        outboundGuard:'public.powerhouse_email_suppression_guard_v1',
        canonicalOwner:'Powerhouse Growth & Revenue OS',
        skill:'.agents/skills/powerhouse-relationship-revenue/SKILL.md'
      }),
      productionEvidence:Object.freeze({
        gmailReadbackVerified:true,
        replyEventsVerified:2,
        didTelecomClass:'objection_need',
        didTelecomSuppressed:true,
        techFestivalClass:'objection_timing',
        techFestivalNurture:true,
        parallelReplyCronCount:0,
        runtimeReadbackAt:'2026-09-29T14:59:12.875008Z'
      }),
      invariants:Object.freeze({
        sentIsNotTerminal:true,
        providerMessageIdIdempotency:true,
        suppressionBeforeSideEffect:true,
        noDuplicateFollowup:true,
        revenueFirstOptimization:true,
        noParallelReplyScheduler:true,
        noParallelCrmOrLearningStore:true,
        cycleGuardNotWeakened:true
      })
    }),
    Object.freeze({
      id:'green-assurance-v1',
      label:'Powerhouse Truthful Green Assurance',
      authority:'supabase+github+provider-readback',
      owner:'whole-brain-reliability',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['runtime health','terminal control-plane health','required evidence coverage','open obligations','provider readback','outcome evidence']),
      outputs:Object.freeze(['root-cause repair','recomputed health','provider-neutral failover state','learning/skill/agent/docs/System Map writeback']),
      runtime:Object.freeze({
        oneBrainHealth:'public.powerhouse_one_brain_runtime_health_v1',
        terminalHealth:'public.powerhouse_terminal_control_plane_health_v1',
        evidenceHealth:'public.powerhouse_evidence_operating_health_v3',
        sourceCoverage:'public.powerhouse_evidence_source_coverage_v1',
        skill:'.agents/skills/powerhouse-green-assurance/SKILL.md',
        learning:'brain/learning/2026-09-29-powerhouse-green-assurance-v1.json',
        truthContract:'config/powerhouse-truth-status-contract.json'
      }),
      productionEvidence:Object.freeze({
        productionMain:'204269314239ea2cc56a00a0da1ed87a5056415f',
        netlifyDeployId:'6abbdf73c4c7d80008d9811f',
        netlifyState:'ready',
        netlifyContext:'production',
        writebackLearning:'brain/learning/2026-09-29-live-assurance-writeback-v1.json',
        livePromotionGovernanceClosure:'brain/learning/2026-09-29-live-promotion-governance-closure-v1.json',
        liveVsFunctionalTruthLearning:'brain/learning/2026-09-29-live-ready-vs-functional-green-v1.json',
        observedReadyDeploy:Object.freeze({
          deployId:'6abbdf73c4c7d80008d9811f',
          commitRef:'204269314239ea2cc56a00a0da1ed87a5056415f',
          state:'ready',
          context:'production',
          publishedAt:'2026-09-29T15:57:21.591Z'
        })
      }),
      invariants:Object.freeze({
        wiringIsNotGreen:true,
        staleIsNotGreen:true,
        unknownIsNotGreen:true,
        providerAckIsNotOutcome:true,
        providerNeutralFailover:true,
        retiredToolingTelemetryOnly:true,
        noDuplicateRepublish:true,
        instagramMiraExactProofRequired:true,
        recomputeAfterRepair:true,
        canonicalWritebackRequired:true,
        liveAssuranceWriteback:true,
        freshReadbackRequiredForCurrentGreen:true,
        livePromotionGovernanceClosure:true,
        readyDeployIsOnlyDeploymentEvidence:true,
        capabilitySubchainsIndependentlyGated:true,
        deploymentReadyNeverImpliesFunctionalGreen:true,
        deploymentAndCapabilityTruthSeparated:true
      })
    }),
    Object.freeze({
      id:'daily-compound-learning',
      label:'Powerhouse Daily Compound Learning',
      authority:'supabase+github',
      owner:'whole-brain-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['verified runtime events','executed actions','existing Outcome Memory','commercial-progression forecasts','forecast calibration']),
      outputs:Object.freeze(['verified outcomes','action-outcome linkage','forecast resolutions','calibration evidence','daily compound-learning control state']),
      runtime:Object.freeze({
        outcomeCandidates:'public.powerhouse_verified_outcome_candidates_v1',
        capture:'public.powerhouse_capture_verified_outcomes_v1(date)',
        forecastCandidates:'public.powerhouse_forecast_resolution_candidates_v3',
        resolver:'public.powerhouse_resolve_forecasts_from_outcomes_v3()',
        control:'public.powerhouse_daily_compound_learning_control_v1',
        orchestrator:'public.powerhouse_run_daily_compound_learning_v1(date)',
        cron:'50 2 * * *',
        wholeBrainDaily:'.github/workflows/whole-brain-canonical-loop-v2.yml',
        universalLearningDaily:'.github/workflows/universal-closed-loop-learning.yml',
        agentContract:'AGENTS.md',
        chatLearningContract:'config/brain-chat-learning-contract.json',
        continuitySkill:'.agents/skills/powerhouse-continuity/SKILL.md'
      }),
      productionEvidence:Object.freeze({
        migrationAppliedVersion:'20260929084144',
        outcomesBefore:6,
        salesOutcomesAfter:24,
        outcomeMemoryAfter:30,
        insertedOutcomes:18,
        actionsLinked:3,
        executedActionOutcomeCoverage:0.4615,
        forecastsTotal:1223,
        forecastsResolved:3,
        forecastResolutionDebt:0,
        runtimeReadbackAt:'2026-09-29T08:41:57Z'
      }),
      invariants:Object.freeze({
        verifiedOutcomesOnly:true,
        testAndSyntheticEvidenceExcluded:true,
        noInventedRevenue:true,
        silenceIsNotNegativeOutcome:true,
        noParallelOutcomeStore:true,
        noParallelForecastStore:true,
        nextDecisionMustConsumeLearning:true,
        wholeBrainIntegrityDaily:true,
        universalClosedLoopDaily:true,
        inheritedByAllChatsAgentsSkills:true,
        chatLearningPreflightRequired:true,
        agentContractRequired:true,
        nextAgentDiscoverabilityRequired:true
      })
    }),
    Object.freeze({
      id:'self-improvement-layer',
      label:'Powerhouse Self-Improvement Layer',
      authority:'supabase',
      owner:'whole-brain-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['Company Intelligence OS','verified Outcome Memory','optimization candidates','quality events','model health','autonomous-improvement evidence','engineering evidence']),
      outputs:Object.freeze(['agent objective registry','learning compiler queue','self-improvement control state','provider-neutral model routing policy','architecture health','controlled promotion recommendations']),
      runtime:Object.freeze({
        control:'public.powerhouse_self_improvement_control_v1',
        learningQueue:'public.powerhouse_learning_compiler_queue_v1',
        agentObjectives:'public.powerhouse_agent_objective_registry_v1',
        orchestrator:'public.powerhouse_run_self_improvement_layer_v1(date)',
        module:'brain/self-improvement/self-improvement-layer.mjs',
        contract:'brain/contracts/self-improvement-layer-v1.json',
        dailyWorkflow:'.github/workflows/powerhouse-daily-self-evolution.yml'
      }),
      productionEvidence:Object.freeze({
        githubImplementationMergeSha:'9feaa95a77e7bc24c53ffd852058fe56de02c67d',
        githubRuntimeHardeningMergeSha:'26199abfb2accb3a015c45490f8e0da9e4e32d47',
        initialMigrationName:'powerhouse_self_improvement_layer_v1',
        initialMigrationSourceVersion:'20260928194500',
        initialMigrationAppliedVersion:'20260928182014',
        hardeningMigrationName:'powerhouse_self_improvement_orchestrator_nonblocking_v1',
        hardeningMigrationSourceVersion:'20260928203000',
        hardeningMigrationAppliedVersion:'20260928183018',
        agentObjectives:6,
        compilerReady:8,
        compilerEvidencePending:0,
        compilerRegressionPending:0,
        escapedDefectsWithoutRegression:0,
        modelHealthDegraded:0,
        modelHealthUnknown:0,
        learningCompanies:5,
        verifiedOutcomes:5,
        runtimeEvents:1,
        dailyCron:'7 3 * * *',
        duplicateOrchestration:false,
        newSecurityAdvisorFindings:0,
        newPerformanceAdvisorFindings:0,
        runtimeReadbackAt:'2026-09-28T18:30:25.114667Z'
      }),
      invariants:Object.freeze({
        noLearningWithoutEvidence:true,
        noChangeWithoutEvaluation:true,
        noDeploymentWithoutRegressionProof:true,
        noIntelligenceWithoutMeasurableOutcome:true,
        noUncontrolledSelfModification:true,
        unknownIsNotGreen:true,
        noParallelLearningStore:true,
        protectedDeliveryReused:true
      })
    }),
    Object.freeze({
      id:'foresight-prediction-intelligence-v2',
      label:'Powerhouse Foresight & Prediction Intelligence v2',
      authority:'supabase',
      owner:'whole-brain-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['Company Graph','predictive signals','external signals','operating outcomes','forecast history','forecast calibration']),
      outputs:Object.freeze(['calibrated forecasts','scenario ensembles','leading indicators','prediction quality','resolution debt','bounded prediction improvement challengers']),
      runtime:Object.freeze({
        forecasts:'public.powerhouse_forecasts',
        signals:'public.powerhouse_predictive_signals',
        calibration:'public.powerhouse_forecast_calibration',
        quality:'public.powerhouse_forecast_quality_v2',
        resolutionDebt:'public.powerhouse_forecast_resolution_debt_v2',
        control:'public.powerhouse_prediction_intelligence_control_v2',
        improvementQueue:'public.powerhouse_prediction_improvement_queue_v2',
        audit:'public.powerhouse_prediction_learning_audit_v2()',
        brain:'scripts/brain/foresight-autonomy.mjs',
        portal:'portal-v2/foresight-intelligence.js',
        contextualPortal:'portal-v2/foresight-context-ui.js',
        predictionQualityApi:'netlify/functions/portal-prediction-intelligence.mjs',
        selfImprovementControl:'public.powerhouse_self_improvement_control_v1',
        contextualVisuals:Object.freeze(['goal forecasts','scenario uncertainty','prediction quality','compound intelligence loop','self-improvement evidence'])
      }),
      productionEvidence:Object.freeze({
        githubMergeSha:'16a15a7ae0c13a3a626c2fedba498c46123ba5c2',
        migrationName:'powerhouse_foresight_prediction_intelligence_v2',
        forecastTotal:1177,
        forecastsDue:3,
        resolvedTotal:3,
        resolutionDebt:0,
        brierScore:0.1092,
        calibrationError:0.3297,
        timingMaeDays:8.9,
        signalTotal:143,
        independentSourceTypes:3,
        topics:16,
        statisticallyUsableBuckets:0,
        predictionState:'CALIBRATION_DEGRADED',
        auditCron:'35 6 * * *',
        predictiveEngineCron:'8 6 * * *',
        calibratorCron:'50 * * * *',
        runtimeReadbackAt:'2026-09-28T18:45:25Z',
        contextualPortalLive:true,
        contextualPortalMergeSha:'6a5e27df02e8cb5d43df7dce38b4094e9180f1af',
        contextualPortalProductionDeploySha:'602973dace20523c20f0b656713243c5c6408f72',
        productionReleaseReadback:'success',
        portalDomReadback:'success'
      }),
      invariants:Object.freeze({
        predictionIsNotFact:true,
        noParallelForecastStore:true,
        unresolvedForecastsAreLearningDebt:true,
        brierAndCalibrationRequired:true,
        horizonSpecificLearning:true,
        scenarioEnsembleForMaterialForecasts:true,
        directSelfRewriteForbidden:true,
        protectedPromotionRequired:true,
        contextualDecisionVisibilityRequired:true
      })
    }),
    Object.freeze({
      id:'company-intelligence-os',
      label:'Powerhouse Company Intelligence OS',
      authority:'supabase',
      owner:'whole-brain-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['canonical source evidence','CRM/relationship evidence','company/people graph','opportunities','actions','provider readback','outcomes','realized value']),
      outputs:Object.freeze(['Company Graph','System of Context','autonomous action candidates','Outcome Memory','compound intelligence next-decision context']),
      runtime:Object.freeze({
        graphNodes:'public.powerhouse_company_graph_nodes_v1',
        graphEdges:'public.powerhouse_company_graph_edges_v1',
        context:'public.powerhouse_system_of_context_v1',
        actionLayer:'public.powerhouse_autonomous_action_layer_v1',
        outcomeMemory:'public.powerhouse_outcome_memory_v1',
        compoundIntelligence:'public.powerhouse_compound_intelligence_v1',
        brainModule:'brain/company-intelligence/company-intelligence-os.mjs',
        contract:'brain/contracts/company-intelligence-os-v1.json',
        orchestrator:'public.powerhouse_run_company_intelligence_os_v1(date)',
        portalProjection:'portal-v2/operating-system/company-intelligence-context.js',
        portalStyles:'portal-v2/company-intelligence-context.css'
      }),
      productionEvidence:Object.freeze({
        githubMainMergeSha:'f177340af3aa08287cc510915623e01ce701778d',
        migrationName:'powerhouse_company_intelligence_os_v1',
        migrationExpectedVersion:'20260928193000',
        migrationAppliedVersion:'20260928175205',
        migrationMatchMode:'UNIQUE_NAME_RECONCILED',
        graphNodes:42217,
        graphEdges:25164,
        companiesInContext:17328,
        actions:2883,
        outcomeMemories:30,
        compoundCompanies:17328,
        runtimeReadbackAt:'2026-09-28T17:54:27Z',
        portalContextualProjectionMergeSha:'0b4547f33a74ce911a0d324a53404cff1cc6e737',
        portalTenantIsolationEvalMergeSha:'764a7387e1852e7c1e8700efc443d29870221f39',
        portalNetlifyDeployId:'6abac41210b244000884a323',
        portalNetlifyCommitRef:'0b4547f33a74ce911a0d324a53404cff1cc6e737',
        portalNetlifyState:'ready',
        portalNetlifyContext:'production',
        portalPublishedAt:'2026-09-28T19:48:21.076Z'
      }),
      invariants:Object.freeze({
        crmIsSourceNotBrain:true,
        noParallelCrm:true,
        noParallelGraphTruth:true,
        noParallelLearningStore:true,
        evidenceBeforeInference:true,
        contextBeforeAction:true,
        actionRequiresLineage:true,
        outcomeRequiresOrigin:true,
        realizedValueObservedNotSynthesized:true,
        learningUpdatesSharedPolicy:true,
        contextualPortalProjection:true,
        contextualProjectionGovernance:'PERMANENT',
        contextualProjectionLanguage:'Wat zien we? → Waarom telt dit? → Wat verwachten we? → Wat doen we? → Wat kwam eruit? → Wat leren we?',
        contextualProjectionTenantRuntimeOnly:true,
        contextualProjectionFailClosed:true,
        expectedRealizedVisualSeparation:true,
        roadmapContextBound:true,
        capabilityGraphContextBound:true,
        customerPortalTenantScopedOnly:true,
        noGlobalUnscopedGraphInCustomerUi:true
      })
    }),
    Object.freeze({
      id:'linkedin-production-auth-authority',
      label:'LinkedIn Production OAuth Authority',
      authority:'supabase+composio-provider-truth',
      owner:'social-publication-authority',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['brain_records.linkedin-composio-setup-current-state-v1','content_publication_obligations','LinkedIn provider URN']),
      outputs:Object.freeze(['channel-specific auth readiness','no-false-blocker decision','anti-duplicate reconnect guard']),
      runtime:Object.freeze({
        setupState:'linkedin-composio-setup-current-state-v1',
        companyOrganizationUrn:'urn:li:organization:18234216',
        publisher:'supabase/functions/powerhouse-social-publisher/index.ts',
        setup:'supabase/functions/powerhouse-composio-linkedin-setup/index.ts',
        skill:'.agents/skills/linkedin-composio-publisher/SKILL.md',
        learning:'brain/learning/2026-09-29-linkedin-production-runtime-authority-v1.json',
        companyStandardPolicy:'brain/policies/linkedin-company-standard-delivery-v1.json',
        companyStandardLearning:'brain/learning/2026-09-29-linkedin-company-standard-delivery-v1.json'
      }),
      productionEvidence:Object.freeze({
        runtimeStatus:'ACTIVE',
        companyReady:true,
        providerPostUrn:'urn:li:share:7510609161110482944',
        verifiedAt:'2026-09-29T08:25:46Z'
      }),
      invariants:Object.freeze({
        productionRuntimeIsCanonical:true,
        chatLocalConnectorIsDiagnosticOnly:true,
        providerUrnBlocksRepublish:true,
        humanOauthOnlyOnProductionHardBoundary:true,
        noRecoveryAliasProliferation:true,
        personalAndCompanyCapabilitiesSeparate:true,
        companyBusinessTopicsOnly:true,
        personalTopicLeakageBlocked:true,
        printerStoryFamilyGloballyRetired:true,
        productionAuthPrecedesChatLocalDiagnostics:true,
        liveTokenHealthRequired:true,
        safeAuthSelfHealing:true,
        explicitUserDeletionAllowsOneNewStoryReplacement:true
      })
    }),
    Object.freeze({
      id:'linkedin-sales-machine-public-intent-bridge',
      label:'LinkedIn Sales Machine — Public Intent Bridge',
      authority:'netlify+supabase',
      owner:'commercial-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['Bedrijfslek result/deel/order intent','SaaS checkout-start','website attribution context']),
      outputs:Object.freeze(['PII-free growth events','commercial intent evidence','Growth Swarm/NBA context','outcome-learning input']),
      runtime:Object.freeze({
        websiteRoutes:Object.freeze(['/','/zelfscan','/afsluiten']),
        eventEndpoint:'/api/growth-event',
        netlifyFunction:'netlify/functions/growth-event.mjs',
        supabaseIngest:'growth-datahub-ingest',
        linkedinSkill:'.agents/skills/powerhouse-linkedin-sales-machine/SKILL.md'
      }),
      productionEvidence:Object.freeze({
        githubImplementationMergeSha:'6bce84b1a3d3f7eba1b7291895f7e7925945fd31',
        productionReadbackRun:36474142016,
        skillProjectionRun:36474141948,
        netlifyDeployId:'6abac341b59a3f00080a08dc',
        netlifyCommitRef:'6bce84b1a3d3f7eba1b7291895f7e7925945fd31',
        netlifyPublishedAt:'2026-09-28T19:44:41.885Z'
      }),
      invariants:Object.freeze({
        piiInGrowthTelemetry:false,
        purposeBoundContactHandling:true,
        oneCanonicalGrowthLoop:true,
        noParallelCrm:true,
        noParallelIntentStore:true,
        consentAndSuppressionRemainAuthoritative:true,
        evidenceAndFatigueGatesRemainAuthoritative:true
      })
    }),
    Object.freeze({
      id:'seo-conversion-orders',
      label:'SEO + Behavioral Conversion-to-Orders Engine v2',
      authority:'github+netlify+supabase',
      owner:'seo-demand+growth-swarm',
      status:'ACTIVE_EVIDENCE_GATED',
      inputs:Object.freeze(['Search Console evidence','DataForSEO evidence','production page state','visitor context','funnel state','CTA/lead/proposal/order/revenue outcomes']),
      outputs:Object.freeze(['commercial SEO opportunity','experience decision','bounded reversible money-page change','experiment outcome','conversion outcome','learning pattern']),
      runtime:Object.freeze({
        skill:'.agents/skills/powerhouse-seo-conversion-orders/SKILL.md',
        growthSkill:'.agents/skills/powerhouse-growth-swarm/SKILL.md',
        persuasionSkill:'.agents/skills/powerhouse-persuasion-revenue/SKILL.md',
        growthLoop:'config/seo-growth-loop.json',
        allowlist:'config/seo-optimization-allowlist.json',
        moneyPageAuthority:'site/seo-order-map.json',
        moneyPageExpansionAuthority:'site/seo-order-expansion.json',
        localeRevenueAuthority:'site/seo-locale-revenue-map.json',
        localizedBuildAuthority:'tools/site-shell/build-localized-routes.mjs',
        sitemapAuthority:'tools/genereer-sitemap.mjs',
        bilingualRevenueSeo:Object.freeze({
          fingerprint:'seo|nl-en|keyword-ownership-to-revenue|v1',
          locales:Object.freeze(['nl','en']),
          dutchCanonical:'unprefixed',
          englishCanonical:'/en/*',
          marketSpecificEnglishKeywords:true,
          literalTranslationKeywordStrategyForbidden:true,
          sameOriginLinksPreserveLocale:true,
          hreflangRequired:Object.freeze(['nl','en','x-default']),
          sitemapIncludesEnglishCanonicals:true,
          revenueChain:'query -> canonical owner -> contextual internal links -> CTA -> lead -> proposal -> paid order -> realized revenue',
          measuredMarkets:Object.freeze(['Netherlands/nl','Netherlands/en','United Kingdom/en','United States/en']),
          regressions:Object.freeze(['tests/seo-locale-revenue-nl-en-v1.test.mjs','tests/seo-order-link-graph.test.mjs'])
        }),
        finalBuildAuthority:'tools/site-shell/apply-money-page-order-conversion.mjs',
        bedrijfslekStandaloneAuthority:'zelfscan.html',
        bedrijfslekV18Exclusion:'tools/v18-views-lijst.mjs',
        bedrijfslekProductLedGrowth:Object.freeze({
          route:'/zelfscan',
          valueBeforePii:true,
          miniLocalOnly:true,
          teamChallenge:true,
          challengePayload:Object.freeze(['score','risk_category','campaign_attribution']),
          terminalOutcomes:Object.freeze(['paid_order','realized_revenue']),
          regression:'tests/brain-bedrijfslek-product-led-acquisition-v1.test.mjs',
          learning:'brain/learning/2026-09-29-bedrijfslek-product-led-growth-borging-v2.json'
        }),
        learning:'brain/learning/2026-09-29-seo-conversion-orders-v1.json',
        companyBrainCategory:Object.freeze({route:'/company-brain',role:'category-acquisition-entry',status:'LIVE_PROVEN',claim:'Een Company Brain is waar Bedrijfsgeheugen begint.',conversion:'/zelfscan',terminalOutcomes:Object.freeze(['paid_order','realized_revenue']),learning:'brain/learning/2026-09-30-company-brain-category-positioning-v1.json',productionEvidence:Object.freeze({protectedMain:'936ca60ad5c2415ff2372880a61aea5b1d690875',netlifyDeployId:'6abcd38195a83a25791474e5',httpStatus:200,canonical:'/company-brain',mobileViewport:'390x844',pageErrors:0,failedAssets:0})})
      }),
      behavioralModels:Object.freeze(['Cialdini','loss-aversion','prospect-theory','Fogg Behavior Model','Hick-Hyman','cognitive-fluency','commitment-ladder','specificity','choice-architecture']),
      optimizationOrder:Object.freeze(['realized revenue','paid orders','qualified proposals','qualified meetings','qualified leads','CTA progression','engagement']),
      invariants:Object.freeze({
        trafficIsNotTerminalOutcome:true,
        productLedValueBeforePii:true,
        privacySafeTeamChallenge:true,
        noParallelBedrijfslekFunnel:true,
        existingCanonicalMoneyPageFirst:true,
        maxDailyAutonomousChanges:3,
        reversibleEvidenceGatedOnly:true,
        contextualPageCompositionAllowed:true,
        rollbackOnTrustAccessibilityOrQualifiedConversionRegression:true,
        productionReadbackRequired:true,
        revenueClaimRequiresObservedOutcome:true,
        noDoorwayThinSpamOrDarkPatterns:true,
        noFakeScarcityUrgencySocialProofHiddenCostsConfirmshamingOrPreselectedConsent:true,
        oneCanonicalCroRevenueStack:true,
        inheritedByAllChatsAndAgents:true,
        currentPrimaryQualification:'ungated Bedrijfslek /zelfscan on homepage; Frisse Blik remains contextual on other money pages',
        publicCopyRequiresSameLineageStaticI18n:true,
        finalBuildArtifactIsAuthority:true,
        bedrijfslekHasSingleRouteOwner:true,
        v18GeneratorMayOverwriteBedrijfslek:false,
        companyBrainIsCategoryNotProductRename:true,
        companyBrainCanonicalOwner:'/company-brain',
        companyBrainMeasuredToRevenue:true,
        staticI18nPostShellFinalArtifactCoverageRequired:true
      })
    }),
    Object.freeze({
      id:'website-portal-professional-parity',
      label:'Website ↔ Portal Professional Parity',
      authority:'github+netlify',
      owner:'website-portal-coherence',
      status:'ACTIVE_EVIDENCE_GATED',
      inputs:Object.freeze(['accepted website baseline','canonical header/footer','Powerhouse product taxonomy','pricing catalog','portal visual contract']),
      outputs:Object.freeze(['contextual public proposition','package recommendation journey','isolated portal demo','bounded portal visuals','canonical AI discovery']),
      runtime:Object.freeze({
        finalizer:'tools/site-shell/finalize-website-coherence-v1.mjs',
        pricing:'tools/site-shell/apply-commercial-pricing-v1.mjs',
        websiteStyle:'assets/site-coherence-v1.css',
        portalStyle:'portal-v2/site-parity-v1.css',
        packageAdvisor:'/pakketadvies',
        publicPortalDemo:'/portaal-demo',
        skill:'skills/website-portal-coherence.md',
        regression:'tests/brain-website-coherence-v1.test.mjs',
        learning:'brain/learning/2026-10-01-website-portal-coherence-v1.json'
      }),
      invariants:Object.freeze({
        customerValueCopyOnly:true,
        internalParityLanguagePubliclyForbidden:true,
        onePrimaryHeroPerPage:true,
        packageFinderReturnsRealAdvice:true,
        comparisonCtasShareBaseline:true,
        publicDemoSeparatedFromCustomerRuntime:true,
        portalVisualsContainerBounded:true,
        canonicalProductLines:Object.freeze(['Powerhouse Intelligence','Powerhouse Agents','Powerhouse Connect']),
        aiDiscoveryPreserved:true,
        contactRoute:'/contact',
        productionReadbackRequired:true
      })
    }),
    Object.freeze({
      id:'daily-full-connection-enrichment',
      label:'Daily Full Connection Enrichment',
      authority:'supabase',
      owner:'commercial-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['bg_connecties','linkedin_engagement_events','powerhouse_predictive_signals','bg_bedrijfsnieuws','bg_externe_signalen','powerhouse_runtime_events','person/company intelligence','opportunity/outcome lineage']),
      outputs:Object.freeze(['daily enriched connection graph','freshness/completeness rollup','person/company/customer opportunity context']),
      runtime:Object.freeze({
        stateTable:'public.powerhouse_connection_enrichment_state_v1',
        view:'public.powerhouse_connection_enrichment_v1',
        refresh:'public.powerhouse_refresh_all_connection_enrichment_v1(date,integer)',
        schedulerOwner:'powerhouse-commercial-learning-v1'
      }),
      invariants:Object.freeze({
        everyConnectionDaily:true,
        allIngestedEvidenceProjected:true,
        sourceEvidencePreserved:true,
        deepDiscoveryBounded:true,
        sensitiveInferenceAllowed:false,
        noParallelCrm:true,
        noParallelScheduler:true
      })
    }),
    Object.freeze({
      id:'relationship-external-intelligence',
      label:'Relationship External Intelligence',
      authority:'supabase',
      owner:'commercial-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['public web evidence','LinkedIn/company updates via supported capabilities','runtime events','person/company/customer lineage']),
      outputs:Object.freeze(['person/company/customer enriched context','predictive signals','opportunity/NBA evidence features']),
      runtime:Object.freeze({
        projector:'public.powerhouse_refresh_relationship_external_intelligence_v1(date)',
        contextView:'public.powerhouse_relationship_context_enriched_v1',
        schedulerOwner:'powerhouse-commercial-learning-v1'
      }),
      invariants:Object.freeze({
        noLooseNewsDeadEnd:true,
        externalEvidenceIsNotBuyingIntent:true,
        sensitiveInferenceAllowed:false,
        preserveProvenance:true,
        noParallelCrm:true,
        noParallelScheduler:true
      })
    }),
    Object.freeze({
      id:'autonomous-engineering-fabric-v3',
      label:'Autonomous Engineering Fabric v3',
      authority:'github',
      owner:'delivery-intelligence',
      status:'LIVE_PROVEN',
      inputs:Object.freeze(['user/chat intent','changed paths','dependency graph','CI telemetry','agent outcome scorecard']),
      outputs:Object.freeze(['risk-classed work packages','capability-routed specialists','bounded parallel waves','single integrated candidate','late-bound closure manifest','daily engineering tuning']),
      runtime:Object.freeze({
        policy:'config/powerhouse-autonomous-engineering-fabric-v3.json',
        tuning:'config/powerhouse-engineering-tuning.json',
        planner:'scripts/brain/autonomous-engineering-fabric-v3.mjs',
        optimizerWorkflow:'.github/workflows/powerhouse-autonomous-engineering-optimizer.yml',
        requiredGate:'.github/workflows/required-test.yml'
      }),
      productionEvidence:Object.freeze({
        implementationMergeSha:'35cc516051f51fa78ef5842687b243c1de810715',
        requiredPrRun:36467540983,
        codeqlPrRun:36467540522,
        optimizerPrRun:36467540607,
        dailySelfEvolutionPrRun:36467540608,
        skillProjectionPrRun:36467540627,
        netlifyDeployId:'6abab74554a72a00072dae3b',
        netlifyCommitRef:'35cc516051f51fa78ef5842687b243c1de810715',
        netlifyPublishedAt:'2026-09-28T18:53:41.769Z'
      }),
      invariants:Object.freeze({
        oneIntegrationWriterPerObligation:true,
        specialistsParallelBeforeIntegration:true,
        riskAwareTesting:true,
        impactGraphRequired:true,
        hotSharedFilesLateBound:true,
        outcomeAwareAgentRouting:true,
        dailyBoundedSelfOptimization:true,
        protectedReleaseAuthorityUnchanged:true,
        noSafetyGateWeakening:true
      })
    }),
    Object.freeze({
      id:'powerhouse-ci-intelligence',
      label:'Powerhouse CI Intelligence & Acceleration',
      authority:'github',
      owner:'delivery-intelligence',
      status:'LIVE_PROVEN',
      inputs:Object.freeze(['GitHub Actions workflow runs','job queue/start/finish timestamps','PR SHA fan-out','lane classification']),
      outputs:Object.freeze(['queue/execution/fan-out metrics','critical-path optimization evidence','runner-waste prevention']),
      runtime:Object.freeze({
        workflow:'.github/workflows/powerhouse-ci-intelligence.yml',
        collector:'scripts/brain/powerhouse-ci-intelligence.mjs',
        requiredGate:'.github/workflows/required-test.yml',
        websiteLane:'.github/workflows/lane-website.yml'
      }),
      productionEvidence:Object.freeze({
        mainSha:'451c6f40868fb35af77d70f6f6aa0972b324f634',
        requiredPrRun:36449795424,
        productionReadbackRun:36454941832,
        ciIntelligenceRun:36454941660,
        netlifyDeployId:'6aba9ce2aa152f00088fc87c',
        netlifyCommitRef:'451c6f40868fb35af77d70f6f6aa0972b324f634'
      }),
      invariants:Object.freeze({
        netlifyBuildParityProductionEnv:true,
        oneRequiredAuthorityPerPr:true,
        supersededPrRunsCancelled:true,
        affectedLanesOnly:true,
        packageManifestNpmCache:true,
        exactShaPreviewReuse:true,
        localBrowserBuildFallbackOnly:true,
        safetyGatesNeverWeakened:true
      })
    }),
    Object.freeze({
      id:'management-accounting-value-driver-intelligence',
      label:'Management Accounting & Value Driver Intelligence',
      authority:'supabase',
      owner:'finance-value-intelligence',
      status:'CANDIDATE_DELIVERY',
      inputs:Object.freeze(['tenant financial metrics','workforce/productivity metrics','operations/commercial metrics','explicit tenant benchmarks','due-diligence/value inputs']),
      outputs:Object.freeze(['management-accounting metrics','value-driver graph','impact/effort roadmap candidates','cash and valuation projections','data gaps']),
      runtime:Object.freeze({
        brainModule:'brain/economics/management-accounting-intelligence.mjs',
        portalModule:'portal-v2/modules/management-accounting-intelligence.js',
        overviewSurface:'Portal V2 executive overview',
        roadmapSurface:'portal.roadmap.items'
      }),
      invariants:Object.freeze({
        noGenericBenchmarkAsCustomerFact:true,
        missingInputNeverBecomesZero:true,
        outputPerHourPreferredWhenAvailable:true,
        workingCapitalIsCashNotEbitda:true,
        capacityValueIsNotCashSaving:true,
        valuationRequiresSupportedEarningsAndMultiple:true,
        roadmapFingerprintDedupe:true,
        derivedValueRemainsPotentialUntilOutcome:true
      })
    }),
    Object.freeze({
      id:'trigger-based-mkb-acquisition',
      label:'Trigger-based MKB Acquisition',
      authority:'supabase',
      owner:'commercial-intelligence',
      status:'LIVE_PROVEN_FAIL_CLOSED_RUNTIME',
      inputs:Object.freeze(['explicit-company-trigger-evidence','company-scoped-predictive-signals']),
      outputs:Object.freeze(['powerhouse_opportunities','powerhouse_forecasts','internal-research-actions']),
      runtime:Object.freeze({
        view:'public.powerhouse_mkb_trigger_intelligence_v1',
        refreshFunction:'public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(date)',
        cycleFunction:'public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)',
        schedulerJob:'powerhouse-commercial-learning-v1',
        scheduler:'27 * * * *'
      }),
      safety:Object.freeze({
        relationshipActivationAloneIsTrigger:false,
        externalSideEffectsAllowed:false,
        speculativeRevenueValueAllowed:false,
        hypothesisTruthBoundary:true
      }),
      productionEvidence:Object.freeze({
        githubMainMergeSha:'4e16c5c496241ce516cd13373103c51b4f9fd6dd',
        migration:'trigger_based_mkb_acquisition_runtime_v1',
        firstControlledEligibleTriggers:0,
        firstControlledExternalOutreach:false,
        ordinaryConnectionFalsePositives:0,
        newSurfaceSecurityAdvisorLints:0
      })
    }),
    Object.freeze({
      id:'workshop-scan-customer-portal',
      label:'Workshop Scan → Personal PDF → Customer Portal',
      authority:'supabase',
      owner:'customer-intelligence',
      status:'LIVE_PROVEN_PERSISTENT_PORTAL',
      inputs:Object.freeze(['consented-workshop-answers','company-context','contact-name','contact-email','contact-phone','optional-company-website']),
      outputs:Object.freeze(['personal-scan-pdf','private-portal-intake','canonical-brain-portal-state','identity-claimed-customer-portal']),
      runtime:Object.freeze({
        scanRoute:'/scan',
        publicIngest:'/api/powerhouse-scan-ingest',
        portalClaim:'/api/portal-scans',
        supabaseFunction:'powerhouse-scan-ingest',
        scanTable:'public.scan_inzendingen',
        privateIntakeTable:'public.workshop_portal_intakes',
        portalStateTable:'public.portal_state_layers'
      }),
      invariants:Object.freeze({
        singleSubmissionKey:true,
        durableServerSideStorage:true,
        portalPreprovisionBeforeAccountClaim:true,
        privatePiiIntake:true,
        personalPdfShowsContactNameEmailPhone:true,
        aggregateLearningContainsPii:false,
        trustedCompanyLogoOnly:true,
        chatsAndAgentsReuseCanonicalLineage:true
      }),
      productionEvidence:Object.freeze({
        productionSmokeWorkflow:'Powerhouse Scan Production Proof',
        productionReadbackWorkflow:'Production Release Readback',
        runtimeFunctionVersion:4,
        privacyModel:'RLS + service-role-only intake'
      })
    })
  ]),
  flow:Object.freeze([
    Object.freeze({from:'external',to:'supabase',label:'signals / provider evidence / outcomes'}),
    Object.freeze({from:'portal',to:'netlify',label:'authenticated requests'}),
    Object.freeze({from:'netlify',to:'supabase',label:'thin API / canonical runtime'}),
    Object.freeze({from:'supabase',to:'portal',label:'runtime projection / evidence / recommendations'}),
    Object.freeze({from:'github',to:'netlify',label:'main → build/deploy'}),
    Object.freeze({from:'github',to:'supabase',label:'versioned migrations / edge functions / contracts'}),
    Object.freeze({from:'supabase',to:'notion',label:'human projection / current state / activity'}),
    Object.freeze({from:'notion',to:'github',label:'human contract / architecture authority / operating context'}),
    Object.freeze({from:'supabase',to:'github',label:'evidence → tests / learning / delivery obligations'}),
    Object.freeze({from:'github',to:'notion',label:'release evidence / docs / system-map writeback'})
  ]),
  inventories:Object.freeze({
    githubWorkflows:Object.freeze(["add-netlify-component-preview.yml","approved-central-blog.yml","autonomous-improvement-completion-gate.yml","bg168-materiality-promotion-tests.yml","bg184-stateful-blocker-dedupe-tests.yml","blog-bijwerken.yml","blog-technical-seo-gate.yml","brain-foundation-diagnostic.yml","brain-foundation-verify.yml","buffer-social-learning.yml","business-os-experience.yml","business-os-foundation.yml","business-os-intelligence.yml","business-os-live-preview.yml","business-os-migration.yml","business-os-trust.yml","canonical-brand-shell-full-build.yml","canonical-brand-shell-live-readback.yml","canonical-brand-shell-test.yml","chat-learning-preflight-pr.yml","codeql.yml","completion-supervisor-backfill-shadow.yml","compliance-status-contract.yml","component-foundation-tdd.yml","component-integration-tdd.yml","component-preview.yml","config-wacht.yml","content-growth-ci.yml","content-growth-learning.yml","daily-blog-live-watchdog.yml","daily-blog-publisher.yml","engineering-intelligence-trust.yml","engineering-os-learning.yml","engineering-supply-chain-trust.yml","error-learning-contract.yml","fresh-device-autonomy-canary.yml","hero-media-production-verify.yml","homepage-hero-video-verify.yml","homepage-pricing-boundary-regression.yml","klanten-uit-broncode.yml","lane-automation.yml","lane-backend.yml","lane-portal.yml","lane-website.yml","learning-contract-delivery-classifier-tests.yml","linkedin-revenue-cockpit-tests.yml","live-preview-smoke.yml","main-protection-observation.yml","main-write-integrity-regression.yml","main-write-integrity.yml","menu-balk-fix.yml","native-approved-blog-supply.yml","obligation-terminal-closure.yml","outcome-obligation-sweep.yml","paginacontrole-debug.yml","paginacontrole.yml","portal-native-regression-tests.yml","portal-parity.yml","portal-v2-live-preview.yml","portal-v2-production-dom-readback.yml","portal-v2-tests.yml","powerhouse-assurance.yml","powerhouse-autonomous-engineering-optimizer.yml","powerhouse-closure-a-f.yml","powerhouse-codeql.yml","powerhouse-daily-blog.yml","powerhouse-daily-self-evolution.yml","powerhouse-delivery-hygiene.yml","powerhouse-delivery-recovery-supervisor.yml","powerhouse-foresight-autonomy.yml","powerhouse-merged-branch-cleanup.yml","powerhouse-obligation-terminalizer.yml","powerhouse-public-rls-regression-guard.yml","powerhouse-quality-intelligence.yml","powerhouse-quality-surface-gate.yml","powerhouse-ci-intelligence.yml","powerhouse-repository-janitor.yml","powerhouse-resource-intelligence.yml","powerhouse-scan-production-proof.yml","powerhouse-security-operations-closure.yml","powerhouse-skill-projection.yml","powerhouse-supabase-security-contract.yml","powerhouse-terminal-writer-lease-closure-guard.yml","prijzen-hero-seo-regression.yml","production-release-readback.yml","production-source-snapshot.yml","regelgeving-actueel.yml","regelgeving-bijwerken.yml","regulatory-source-watch.yml","repo-writer-candidate-shadow.yml","repo-writer-cheap-canary.yml","repo-writer-gate-dispatch.yml","repo-writer-operational-verification.yml","repo-writer-parity-rollback.yml","repository-hygiene.yml","required-test.yml","revenue-content-intelligence.yml","revenue-learning.yml","runtime-authority-governance-tests.yml","security-operations-proof.yml","seo-controle.yml","seo-growth-intelligence.yml","seo-order-engine.yml","shared-agent-memory-tests.yml","supabase-pr-preview.yml","unified-brain-delivery.yml","unified-content-operations.yml","universal-closed-loop-learning.yml","universal-event-retention-contract.yml","v18-megamenu-production-readback.yml","v18-production-promotion.yml","verify-approved-central-blog.yml","weekblog.yml","whole-brain-canonical-loop-v2.yml","writer-certification-reconcile.yml","writer-production-reconcile.yml"]),
    netlifyFunctions:Object.freeze(["_ai-usage-store.mjs","_brain-ai.mjs","_brain-event-store.mjs","_buffer-social-collector.mjs","_commercial-lead.mjs","_connector-ai.mjs","_cost-projection-store.mjs","_portal-connectors-store.mjs","_portal-eu-primary-store.mjs","_portal-project-store.mjs","_portal-read-model-store.mjs","_portal-supabase-store.mjs","_revenue-learning-model.mjs","_revenue-learning-store.mjs","_social-learning-model.mjs","_social-learning-store.mjs","brain-operating-ingest.mjs","brain-operating-loop.mjs","brain-runtime-metric.mjs","buffer-social-collect.mjs","checkout-create.mjs","checkout-readiness.mjs","company-decision-notion-sync.mjs","company-decision.mjs","connector-ai-guide.mjs","connector-readiness.mjs","content-learning-application-reconcile.mjs","content-learning.mjs","document-extractor.mjs","growth-event.mjs","growth-intelligence-daily.mjs","growth-outcome.mjs","growth-replay.mjs","i18n-translate.mjs","instagram-video-frames.mjs","koppelingen.mjs","linkedin-revenue-cockpit.mjs","meta-instagram-token-refresh.mjs","monitor.mjs","portaalvraag.mjs","portal-business-input.mjs","portal-connectors.mjs","portal-entitlements.mjs","portal-feedback.mjs","portal-ondernemersdata.mjs","portal-project.mjs","portal-scans.mjs","portal-state.mjs","powerhouse-control-plane-evidence.mjs","powerhouse-composio-config.mjs","powerhouse-composio-secret-sync.mjs","powerhouse-composio-secret-sync-deploy.mjs","powerhouse-composio-secret-sync-now.mjs","powerhouse-control-plane.mjs","powerhouse-costs.mjs","powerhouse-meta-instagram-config.mjs","powerhouse-meta-instagram-oauth-callback.mjs","powerhouse-observability.mjs","powerhouse-scan-ingest.mjs","revenue-learning-context.mjs","revenue-learning-evaluate.mjs","revenue-learning-project.mjs","social-learning-context.mjs","social-learning-evaluate.mjs","social-outcome-ingest.mjs","social-publication-delivery.mjs","stripe-webhook.mjs","vraag.mjs"]),
    supabaseFunctions:Object.freeze(["bg-analytics-sync-composio","bg-buffer-sync","bg-dagoverzicht","bg-ga4-sync","bg-notion-sync","bg-opdrachtenradar","bg-pre-publish-review","brain-operating-authority","brain-runtime-metric-ingest","commercial-lead-ingest","content-operations","growth-datahub-ingest","portal-state-eu","powerhouse-autonomous-outreach","powerhouse-composio-instagram-setup","powerhouse-composio-linkedin-setup","powerhouse-content-loop","powerhouse-content-orchestrator","powerhouse-dataforseo-intelligence","powerhouse-forecast-calibrator","powerhouse-growth-tools","powerhouse-instagram-media-router","powerhouse-instagram-media-verifier","powerhouse-instagram-temporal-verifier","powerhouse-linkedin-sales-machine","powerhouse-meta-instagram-setup","powerhouse-predictive-engine","powerhouse-relationship-public-research","powerhouse-revenue-intelligence","powerhouse-runtime","powerhouse-scan-ingest","powerhouse-seo-opportunity-resolver","powerhouse-social-publisher","powerhouse-system-map-inventory","resource-usage-eu","revenue-learning-store","social-learning-store"]),
    skills:Object.freeze(["instagram-composio-publisher","linkedin-composio-publisher","personal-linkedin-life-only","powerhouse-autonomous-engineering-fabric","powerhouse-browser-gate-boundedness","powerhouse-company-intelligence-os","powerhouse-foresight-prediction-intelligence","powerhouse-connector-response-normalization","powerhouse-continuity","powerhouse-daily-full-connection-enrichment","powerhouse-delivery-concurrency","powerhouse-delivery-self-optimization","powerhouse-growth-swarm","powerhouse-linkedin-sales-machine","powerhouse-management-accounting-intelligence","powerhouse-manual-sales-handoff","powerhouse-netlify-production-truth","powerhouse-persuasion-revenue","powerhouse-post-merge-codeql","powerhouse-relationship-external-intelligence","powerhouse-relationship-revenue","powerhouse-resource-sustainability","powerhouse-system-map-governance","powerhouse-self-improvement-layer","powerhouse-toolchain-authority","seo-revenue-growth","trigger-based-mkb-acquisition"]),
    agentFabricModules:Object.freeze(["agent-fabric.mjs","agent-registry.mjs","agent-team.mjs","agent-work.mjs","completion-supervisor.mjs","learning-memory.mjs","self-heal.mjs","team-memory-bridge.mjs"])
  }),
  providerSnapshot:Object.freeze({
    supabase:Object.freeze({tables:255,views:136,functions:250,activeCronJobs:51,projectId:'adhjwmvyoixzjtmiroln'}),
    github:Object.freeze({workflows:116,skills:27,agentFabricModules:8}),
    netlify:Object.freeze({functions:68}),
    notion:Object.freeze({canonicalSystemMap:true,humanHandbook:true,latestVerifiedState:true,agentActivityLog:true})
  }),
  agentRegistrationContract:Object.freeze({
    required:true,
    rule:'Every material current or future chat, agent, workflow or autonomous capability must be an intrinsic Powerhouse loop node and must become discoverable in this System Map through canonical runtime actor evidence and/or repository inventory registration.',
    beforeWork:Object.freeze(['read canonical System Map','read current state and open obligations','reuse existing capability before creating a new one']),
    onCreateOrChange:Object.freeze(['register component/agent identity','declare owner, domain, inputs, outputs and relations','emit runtime evidence with actor identity','update tests/contracts/inventory when structural topology changes','update repository human documentation and the human System Map in the same lineage']),
    beforeTerminal:Object.freeze(['production/provider readback','learning + prevention writeback','skill projection when applicable','repository human documentation readback','System Map read-after-write']),
    failClosed:'An unregistered material agent/capability or a stale topology inventory is WRITEBACK_INCOMPLETE and cannot be LIVE_BEWEZEN.',
    contextualVisibilityRule:'Material intelligence that changes a user decision must be projected into the relevant Portal V2 context in the same lineage.'
  }),
  systemMapGovernance:Object.freeze({
    fingerprint:'powerhouse|system-map|same-lineage-auto-writeback|v1',
    canonicalMachineSource:'platform/system-map/canonical-system-map.mjs',
    canonicalHumanSource:'docs/powerhouse/POWERHOUSE_SYSTEM_MAP_GOVERNANCE.md',
    portalProjection:'/portal-v2/?page=powerhouse-control-center',
    inheritedBy:Object.freeze(['all-current-chats','all-future-chats','all-current-agents','all-future-agents','workflows','autonomous-nodes']),
    trigger:'Any material change to skills, agents, intelligence, workflows, connectors, runtime authority, data flows, topology, ownership, relationships, charts or canonical control surfaces.',
    sameLineageRequired:true,
    readAfterWriteRequired:true,
    userReminderRequired:false,
    requiredWriteback:Object.freeze(['machine-system-map','human-architecture-docs','relevant-skill-inventory','brain-learning','development-ledger','portal-or-human-projection-when-applicable']),
    failClosedState:'SYSTEM_MAP_WRITEBACK_INCOMPLETE',
    terminalGreenWithStaleMap:false
  }),
  canonicalWebsiteChrome:Object.freeze({
    fingerprint:'powerhouse|website-shell|canonical-chrome-geometry|v1',
    label:'Canonical public website CMS shell',
    authority:'github+netlify',
    owner:'website-delivery',
    status:'ACTIVE_PROTECTED_CONTRACT',
    surfaces:Object.freeze(['public-header','primary-navigation','footer','solutions-megamenu','more-megamenu','mobile-navigation','public-language-switcher']),
    publicLocaleAuthority:Object.freeze({
      fingerprint:'powerhouse|public-cms-i18n|shared-shell-same-route|v1',
      locales:Object.freeze(['nl','en']),
      dutchCanonical:'unprefixed',
      englishCanonical:'/en/*',
      sameRouteInvariant:'/x <-> /en/x; / <-> /en/',
      buildAuthority:Object.freeze(['tools/site-shell/apply-i18n.mjs','tools/site-shell/build-localized-routes.mjs']),
      runtimeGuard:'assets/js/i18n.js',
      clickOwnership:'window-capture-before-mobile-menu-handlers',
      cacheRule:'versioned-i18n-assets-required',
      navigationPersistence:Object.freeze({
        fingerprint:'website|i18n|persistent-public-navigation|v1',
        selectedLocalePersistsAcrossPublicNavigation:true,
        englishTargets:'/en/*',
        dutchTargets:'unprefixed',
        preserves:Object.freeze(['query','hash']),
        dynamicLinksIncluded:true,
        excludedPrefixes:Object.freeze(['/api/','/.netlify/','/assets/','/functions/','/portal','/klantportaal']),
        regression:'tests/brain-i18n-persistent-navigation-v1.test.mjs',
        learning:'brain/learning/2026-09-30-public-i18n-persistent-navigation-v1.json'
      }),
      productionAuthority:'netlify-current-deploy-exact-main',
      liveReadback:Object.freeze(['pricing-nl-en-nl','systems-nl-en-nl','cross-page-locale-persistence','html-lang','header-footer-language-state'])
    }),
    geometry:Object.freeze({
      desktopShellWidthPx:1220,
      desktopNavigationHeightPx:72,
      moreMegamenuMaxWidthPx:1190,
      solutionsMegamenuWidthPx:850,
      desktopGutterPx:20,
      mobileGutterPx:12,
      routeParityTolerancePx:1,
      megamenuParityTolerancePx:2
    }),
    authorityFiles:Object.freeze([
      'tools/bouw-v18-production-core.mjs',
      'tools/site-shell/v18-megamenu-browser-check.mjs',
      'tests/v18-megamenu-regression-lock.test.mjs',
      'docs/sitestandaard.md'
    ]),
    inheritedBy:Object.freeze(['all-public-routes','all-current-chats','all-future-chats','all-current-agents','all-future-agents','website-workflows']),
    invariant:'No route-local header/navigation/footer/megamenu geometry fork; every public route inherits one CMS-like canonical chrome.',
    productionReadbackRequired:true
  }),
  bilingualSeoRevenue:Object.freeze({
    fingerprint:'seo|nl-en|revenue-ownership|hreflang|v1',
    label:'Bilingual SEO → revenue intelligence',
    owner:'seo-revenue-growth',
    status:'ACTIVE_PROTECTED_CONTRACT',
    locales:Object.freeze(['nl','en']),
    dutchCanonical:'unprefixed',
    englishCanonical:'/en/*',
    canonicalOwnerRegistry:Object.freeze(['site/seo-order-map.json','site/seo-order-expansion.json']),
    localeRevenueProjection:'site/seo-locale-revenue-map.json',
    marketEvidence:Object.freeze({
      table:'public.powerhouse_seo_keyword_intelligence_v1',
      priorityView:'public.powerhouse_seo_keyword_revenue_priority_v1',
      identity:'tenant_id + locale + market + keyword',
      source:'DataForSEO + Search Console + realized outcomes',
      forecastIsRevenue:false
    }),
    productionPipeline:Object.freeze([
      'tools/site-shell/build-localized-routes.mjs',
      'tools/seo-order-engine/apply-revenue-links.mjs',
      'tools/genereer-sitemap.mjs',
      'tools/seo-order-engine/validate-locales.mjs'
    ]),
    staticEnglishCache:Object.freeze({
      requiredInProduction:true,
      authority:'config/bg-static-i18n-en.json + config/bg-static-i18n-en.d/*.json',
      exactSourceStringRequired:true,
      validator:'node tools/site-shell/build-localized-routes.mjs --validate-cache',
      failClosedState:'STATIC_I18N_CACHE_INCOMPLETE',
      dutchFallbackOnEnglishProduction:false,
      learning:'brain/learning/2026-09-30-seo-static-i18n-cache-complete-v1.json'
    }),
    technicalContracts:Object.freeze([
      'self-canonical-per-locale',
      'reciprocal-hreflang-nl-en-x-default',
      'NL-and-EN-sitemap-indexation',
      'no-legacy-nl-canonicals',
      'one-keyword-owner-per-locale',
      'localized-support-owner-inheritance'
    ]),
    revenueLoop:'query/market evidence -> canonical intent owner -> localized landing -> internal revenue links -> CTA -> lead -> proposal -> paid order -> realized revenue -> learning -> next SEO action',
    searchIntelligence:'tools/seo-growth/search-intelligence.mjs',
    dailyRevenueIntelligence:'netlify/functions/growth-intelligence-daily.mjs',
    primaryCommercialAsset:Object.freeze({
      route:'/ai-modelwijzer',
      nlKeyword:'ai modellen vergelijken',
      enRoute:'/en/ai-modelwijzer',
      enKeyword:'AI model comparison'
    }),
    failClosedStates:Object.freeze(['KEYWORD_OWNER_COLLISION','LOCALE_PEER_MISSING','HREFLANG_MISMATCH','SITEMAP_LOCALE_GAP','REVENUE_LINK_GAP']),
    outcomePriority:Object.freeze(['realized_revenue','paid_order','proposal','lead','cta','organic_click','impression'])
  }),
  sourceBackedOutbound:Object.freeze({
    fingerprint:'powerhouse-source-backed-all-channels-v1',
    label:'Source-backed outbound loop',
    status:'ACTIVE_CONTINUOUSLY_ASSURED',
    loopAssuranceKey:'source-backed-outbound',
    cadenceMinutes:60,
    canonicalLineage:'SOURCE -> EVIDENCE -> DEDUPE -> PROBLEM/TRIGGER -> CHANNEL FIT -> CANDIDATE -> IDENTITY/TRUTH GATE -> PUBLISH/SEND -> PROVIDER READBACK -> OUTCOME -> LEARNING -> NEXT SELECTION',
    channels:Object.freeze(['instagram_company','linkedin_personal','linkedin_company','blog','email','linkedin_dm']),
    runtimeAuthorities:Object.freeze([
      'public.powerhouse_outbound_source_lineage_v1',
      'public.powerhouse_materialize_source_backed_channel_candidates_v1(date)',
      'public.powerhouse_require_source_for_direct_outreach_v1()',
      'public.powerhouse_refresh_outbound_source_lineage_v1(date)',
      'public.powerhouse_refresh_source_backed_outbound_assurance_v1(date)',
      'supabase/functions/powerhouse-content-orchestrator/index.ts'
    ]),
    sourceRule:'Fresh eligible evidence-backed candidates outrank static calendar or evergreen fallback.',
    personalTruthRule:'External public evidence may select a LinkedIn-personal theme but can never manufacture an Arthur first-person experience.',
    directOutreachRule:'Email and LinkedIn DM require traceable account/person evidence plus person/company context before send eligibility.',
    outcomeWriteback:Object.freeze(['social-metrics','email-replies','linkedin-dm-replies','leads','meetings','orders','revenue']),
    continuousAssurance:Object.freeze({requiredStages:8,scheduler:'powerhouse-outbound-source-lineage-hourly-v1',greenRequiresCurrentRuntime:true})
  }),
  needDiscovery:Object.freeze({
    fingerprint:'powerhouse-need-discovery-v1',
    label:'Powerhouse Need Discovery',
    authority:'github+supabase',
    owner:'powerhouse-commercial-learning-v1',
    status:'CANDIDATE',
    stages:Object.freeze(['goal','situation','problem','impact','urgency','value','decision','next_step']),
    channels:Object.freeze(['website','linkedin_company','blog','email','linkedin_dm','sales_conversation','portal']),
    runtime:Object.freeze({
      engine:'brain/revenue/need-discovery.mjs',
      contract:'config/powerhouse-need-discovery-v1.json',
      events:'public.powerhouse_need_discovery_events_v1',
      profiles:'public.powerhouse_need_discovery_profiles_v1',
      actionEnrichment:'public.powerhouse_apply_need_discovery_v1()',
      website:'https://www.bedrijfsgeheugen.nl/behoeftecheck',
      portal:'/portal-v2/?page=sales-intelligence'
    }),
    invariant:'Engagement is interest only. An offer requires a buyer-confirmed problem, impact and urgency.',
    outcomeLoop:Object.freeze(['reply','confirmed_problem','confirmed_impact','qualified_conversation','meeting','scan','proposal','paid_order','realized_revenue','learning'])
  }),
  socialPublicationGovernance:Object.freeze({
    fingerprint:'linkedin-company-historical-dedupe-v5',
    rule:'Every social post must use a genuinely new underlying story family; LinkedIn company and personal both require durable historical story fingerprints before provider write.',
    scope:'cross-date-cross-channel-all-chats-agents',
    providerCreateConsumesStory:true,
    userReportedDuplicateRetiresStoryFamily:true,
    canonicalCompanyNormalization:Object.freeze(['urls','hashtags','publication-date-markers','punctuation-formatting-noise','whitespace']),
    cumulativeGates:Object.freeze(['raw-hash','normalized-hash','shingle-similarity','canonical-story-fingerprint','semantic-story-family']),
    atomicDailyWriterIsHistoricalNoveltyProof:false,
    retryReconnectReplacementWriteForbidden:true,
    runtimeAuthority:'supabase/functions/powerhouse-social-publisher/index.ts',
    regressionAuthority:'tests/brain-linkedin-company-historical-dedupe-v1.test.mjs',
    learningAuthority:'brain/learning/2026-09-29-linkedin-company-historical-dedupe-v1.json',
    skillAuthority:'.agents/skills/linkedin-composio-publisher/SKILL.md',
    knownRetiredExamples:Object.freeze(['printer','employee_absence_or_departure__knowledge_only_in_heads'])
  }),
  userFacingReportingContract:Object.freeze({
    fingerprint:'delivery|user-facing-reporting|terminal-outcomes-only|v1',
    mode:'TERMINAL_OUTCOMES_ONLY',
    internalExecutionStateUserVisible:false,
    allowedTerminalStates:Object.freeze(['LIVE_BEWEZEN','ROLLED_BACK_GREEN','BLOCKED_HARD_BOUNDARY']),
    hardBoundaryOutput:'minimum external human action only',
    technicalDetailPolicy:'explicit user request only',
    interruptionCreatesHandoff:false,
    continuationFingerprint:'delivery|terminal-continuation|no-internal-handoff|v2',
    ownerMustContinueUntilTerminal:true,
    internalBlockerIsStopCondition:false,
    chatOrClientTimeoutCancelsObligation:false,
    userContinuePromptRequired:false,
    resumeFromCanonicalCheckpoint:true
  })
});


export const POWERHOUSE_LOOP_ASSURANCE_V3 = Object.freeze({
  fingerprint:'powerhouse|loop-assurance|receipt-bridge|v3',
  owner:'powerhouse-loop-assurance-v2',
  cadenceMinutes:5,
  registry:'public.powerhouse_loop_assurance_registry_v1',
  receipts:'public.powerhouse_loop_assurance_receipts_v1',
  state:'public.powerhouse_loop_assurance_state_v1',
  aggregateHealth:'public.powerhouse_loop_integrity_health_v1',
  receiptBridge:'public.powerhouse_sync_loop_assurance_receipts_v1',
  requiredStages:Object.freeze(['input','decision','action','readback','outcome','measurement','learning','guard']),
  criticalZeroEvidence:'RED',
  truthRule:'No synthetic outcome, learning or guard evidence; GREEN requires fresh proof for every required stage.'
});

export const POWERHOUSE_LOOP_ASSURANCE_TERMINAL_LIVE_CLOSURE_V1 = Object.freeze({
  fingerprint:'powerhouse|loop-assurance|terminal-live-closure|2026-09-30-v1',
  status:'LIVE_WITH_TRUTHFUL_AMBER_FLEET',
  inheritedBy:Object.freeze(['all-current-chats','all-future-chats','all-current-agents','all-future-agents']),
  dynamicRegistry:true,
  exactGreenRule:'8/8 fresh required stage evidence',
  historicalGreenReusable:false,
  protectedMain:'9ae500bb184c5e36053c7ca64fb2d51bea070d9c',
  netlify:Object.freeze({
    state:'ready',
    commitRef:'9ae500bb184c5e36053c7ca64fb2d51bea070d9c',
    publishedAt:'2026-09-29T19:31:30.436Z'
  }),
  productionReadback:Object.freeze({
    observedAt:'2026-09-29T19:31:53.360061Z',
    totalLoops:13,
    greenLoops:2,
    amberLoops:11,
    redLoops:0,
    fullyEvidencedLoops:2,
    greenLoopKeys:Object.freeze(['autonomous-outreach','source-backed-outbound'])
  }),
  closureArtifacts:Object.freeze([
    'brain/learning/2026-09-30-powerhouse-loop-assurance-terminal-live-closure-v1.json',
    'docs/development-ledger-events/2026-09-30-powerhouse-loop-assurance-terminal-live-closure-v1.md',
    'docs/changes/2026-09-30-powerhouse-loop-assurance-terminal-live-closure-v1.md',
    '.agents/skills/powerhouse-green-assurance/SKILL.md',
    'AGENTS.md'
  ])
});


export const COMMERCIAL_OUTBOUND_SELF_HEAL_V1 = Object.freeze({
  fingerprint:'commercial|outbound-transport-self-heal|gmail-linkedin-dm|v1',
  owner:'powerhouse-commercial-learning-v1',
  salesActionAuthority:'public.powerhouse_sales_actions',
  outcomeAuthority:'public.powerhouse_sales_outcomes',
  failureAuthority:'public.brain_failure_registry',
  assuranceLoop:'autonomous-outreach',
  providerPreflight:Object.freeze({
    sameProviderProjectRequired:true,
    activeConnectionRequired:true,
    mcpWordIdIsRawApiConnectedAccountId:false,
    directExecuteRequiresEntityIdentity:true,
    literalLatestVersionForbidden:true,
    structuredProviderErrorRequired:true
  }),
  recovery:Object.freeze({
    recoverableTransportErrorTerminal:false,
    gmailFallback:'canonical active Gmail connector in same sales-action lineage',
    preserve:Object.freeze(['daily-send-cap','suppression','cooldown','consent-or-existing-relationship','dedupe','republish-forbidden']),
    providerMessageThreadReadbackRequired:true
  }),
  linkedinDm:Object.freeze({
    failClosedWithoutTrueSendCapability:true,
    postOrCommentIsDm:false,
    authorizedEmailFallbackWhenKnownAddress:true
  }),
  referenceIncident:'2026-09-30'
});
