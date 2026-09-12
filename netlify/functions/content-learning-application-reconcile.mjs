import ledger from '../../data/content-publication-ledger.json' with { type: 'json' };
import { createRevenueLearningStore } from './_revenue-learning-store.mjs';
import { reconcileLearningApplications } from '../../tools/content-growth/selection-audit.mjs';

export async function runContentLearningApplicationReconcile({store=createRevenueLearningStore(),now=new Date()}={}){
  return reconcileLearningApplications({ledger,store,now});
}

export default async function contentLearningApplicationReconcile(){
  try{
    const result=await runContentLearningApplicationReconcile();
    console.log('CONTENT_LEARNING_APPLICATION_RECONCILED',JSON.stringify(result));
  }catch(error){
    console.error('CONTENT_LEARNING_APPLICATION_RECONCILE_FAILED',error);
    throw error;
  }
}

export const config={schedule:'@hourly'};
