import { runResearchWorkflow } from './research';
import { formatForConsole } from '../utils/formatter';

/**
 * List workflow - displays content without writing files
 * This is a read-only mode that shows what would be generated
 */
export async function runList(): Promise<void> {
  console.log('🔍 Running list mode (read-only)...\n');

  try {
    // Run the research workflow
    const result = await runResearchWorkflow();

    // Display results to console
    formatForConsole(result);

    console.log('\n✅ List mode completed (no files written)');
  } catch (error: any) {
    console.error('\n❌ Error during research workflow:', error.message);
    throw error;
  }
}
