import { useI18n } from 'vue-i18n'

export const PRIORITY = {
    'HIGH' : 1,
    'MEDIUM' : 2,
    'LOW' : 3
}

export function TranslatePriority(value)
{
    const { t } = useI18n();

    switch(value){
        case PRIORITY.HIGH:
            return t('high');
        case PRIORITY.MEDIUM:
            return t('medium');
        case PRIORITY.LOW:
            return t('low');
    }
}