alter table public.brain_ai_governance_registry add column if not exists inference_platform text, add column if not exists training_use text not null default 'UNKNOWN', add column if not exists processing_scope text, add column if not exists cross_border_transfer text, add column if not exists subprocessors text[] not null default '{}', add column if not exists transfer_safeguard text, add column if not exists provider_evidence_urls text[] not null default '{}';

update public.brain_ai_governance_registry
set inference_platform='Amazon Bedrock',
    training_use='NO',
    processing_scope=case when model_id like 'global.%' then 'GLOBAL' else coalesce(processing_scope,'UNKNOWN') end,
    cross_border_transfer=case when model_id like 'global.%' then 'POSSIBLE_OUTSIDE_EEA' else coalesce(cross_border_transfer,'UNKNOWN') end,
    subprocessors=array['Amazon Web Services'],
    transfer_safeguard='AWS DPA + EU SCCs incorporated in AWS Service Terms for applicable transfers',
    provider_evidence_urls=array[
      'https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html',
      'https://docs.aws.amazon.com/prescriptive-guidance/latest/security-reference-architecture-generative-ai/gen-ai-sra.html',
      'https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html',
      'https://aws.amazon.com/service-terms/'
    ],
    updated_at=now()
where provider='Anthropic' and model_id like 'global.anthropic.%';
