/**
 * Server-side utility for creating courses on-chain.
 * Uses BACKEND_SIGNER_KEY (which is also the config authority).
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { PROGRAM_ID, getConfigPda, getCoursePda } from "./program";

// Anchor discriminator for "create_course"
const CREATE_COURSE_DISC = Buffer.from([
  120, 121, 154, 164, 107, 180, 167, 241,
]);

function getBackendSigner(): Keypair {
  const keyJson = process.env.BACKEND_SIGNER_KEY;
  if (!keyJson) {
    throw new Error("BACKEND_SIGNER_KEY not configured");
  }
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keyJson)));
}

function getConnection(): Connection {
  return new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
    "confirmed"
  );
}

/**
 * Borsh-serialize CreateCourseParams
 */
function serializeCreateCourseParams(params: {
  courseId: string;
  creator: PublicKey;
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  creatorRewardXp: number;
}): Buffer {
  const courseIdBytes = Buffer.from(params.courseId, "utf-8");
  const contentTxId = Buffer.alloc(32);

  const size =
    4 + courseIdBytes.length + // string
    32 + // creator
    32 + // content_tx_id
    1 + // lesson_count
    1 + // difficulty
    4 + // xp_per_lesson
    2 + // track_id
    1 + // track_level
    1 + // prerequisite option tag (None)
    4 + // creator_reward_xp
    2; // min_completions_for_reward

  const buf = Buffer.alloc(size);
  let offset = 0;

  buf.writeUInt32LE(courseIdBytes.length, offset);
  offset += 4;
  courseIdBytes.copy(buf, offset);
  offset += courseIdBytes.length;

  params.creator.toBuffer().copy(buf, offset);
  offset += 32;

  contentTxId.copy(buf, offset);
  offset += 32;

  buf.writeUInt8(params.lessonCount, offset);
  offset += 1;

  buf.writeUInt8(params.difficulty, offset);
  offset += 1;

  buf.writeUInt32LE(params.xpPerLesson, offset);
  offset += 4;

  buf.writeUInt16LE(params.trackId, offset);
  offset += 2;

  buf.writeUInt8(params.trackLevel, offset);
  offset += 1;

  // prerequisite: None
  buf.writeUInt8(0, offset);
  offset += 1;

  buf.writeUInt32LE(params.creatorRewardXp, offset);
  offset += 4;

  buf.writeUInt16LE(10, offset);

  return buf;
}

export interface CreateCourseOnChainParams {
  courseId: string;
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
}

/**
 * Check if a course exists on-chain
 */
export async function courseExistsOnChain(courseId: string): Promise<boolean> {
  const connection = getConnection();
  const coursePda = getCoursePda(courseId);
  const info = await connection.getAccountInfo(coursePda);
  return info !== null;
}

/**
 * Create a course on-chain using the backend authority keypair.
 * Returns the transaction signature, or null if the course already exists.
 */
export async function createCourseOnChain(
  params: CreateCourseOnChainParams
): Promise<string | null> {
  const connection = getConnection();
  const authority = getBackendSigner();
  const coursePda = getCoursePda(params.courseId);
  const configPda = getConfigPda();

  // Check if already exists
  const existing = await connection.getAccountInfo(coursePda);
  if (existing) {
    return null;
  }

  const creatorRewardXp = params.lessonCount * params.xpPerLesson;

  const paramsData = serializeCreateCourseParams({
    courseId: params.courseId,
    creator: authority.publicKey,
    lessonCount: params.lessonCount,
    difficulty: params.difficulty,
    xpPerLesson: params.xpPerLesson,
    trackId: params.trackId,
    trackLevel: params.trackLevel,
    creatorRewardXp,
  });

  const data = Buffer.concat([CREATE_COURSE_DISC, paramsData]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: coursePda, isSigner: false, isWritable: true },
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: authority.publicKey, isSigner: true, isWritable: true },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    data,
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [authority]);
  return sig;
}
