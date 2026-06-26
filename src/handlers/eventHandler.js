import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const loadEvents = async (client) => {
  const eventsPath = join(__dirname, '../events');
  const loadedEvents = [];

  try {
    // Walk through event directories recursively
    const walkDir = (dir) => {
      const files = readdirSync(dir);
      for (const file of files) {
        const filePath = join(dir, file);
        const stats = statSync(filePath);
        
        if (stats.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.js')) {
          loadedEvents.push(filePath);
        }
      }
    };

    walkDir(eventsPath);

    // Load each event
    for (const filePath of loadedEvents) {
      try {
        const event = await import(`file://${filePath}`);
        const eventData = event.default || event;
        
        if (!eventData.name || typeof eventData.execute !== 'function') {
          logger.warn(`Event ${filePath} is missing name or execute function`);
          continue;
        }

        // Register event
        if (eventData.once) {
          client.once(eventData.name, (...args) => 
            eventData.execute(...args, client)
          );
        } else {
          client.on(eventData.name, (...args) => 
            eventData.execute(...args, client)
          );
        }

        logger.info(`Loaded event: ${eventData.name} from ${filePath}`);

      } catch (error) {
        logger.error(`Failed to load event from ${filePath}:`, error);
      }
    }

    logger.info(`Loaded ${loadedEvents.length} events`);
    return loadedEvents;

  } catch (error) {
    logger.error('Failed to load events:', error);
    throw error;
  }
};

export const unloadEvents = async (client) => {
  try {
    client.removeAllListeners();
    logger.info('All events unloaded');
  } catch (error) {
    logger.error('Failed to unload events:', error);
    throw error;
  }
};
