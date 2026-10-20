import { useI18n } from 'vue-i18n'

export const STATUS = {
    'PENDING' : 1,
    'IN_PROGRESS' : 2,
    'WAITING_REVIEW' : 3,
    'COMPLETED' : 4
}

export function TranslateStatus(value)
{
    const { t } = useI18n();

    switch(value){
        case STATUS.PENDING:
            return t('pending');
        case STATUS.IN_PROGRESS:
            return t('in-progress');
        case STATUS.WAITING_REVIEW:
            return t('waiting-review');
        case STATUS.COMPLETED:
            return t('completed');
    }
}