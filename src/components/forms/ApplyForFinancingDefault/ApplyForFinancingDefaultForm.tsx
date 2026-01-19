import { ChangeEvent, useCallback, useState, useRef } from 'react'
import classNames from 'classnames'
import Image from 'next/image'
import { SubmitHandler, useForm } from 'react-hook-form'
import { MultiValue, SingleValue } from 'react-select'
import TextField from '@/ui/components/TextField/TextField'
import Button from '@/ui/components/Button/Button'
import { yupResolver } from '@hookform/resolvers/yup'
import { schema } from './schema'
import TextAreaField from '@/ui/components/TextField/TextAreaField'
import {
  AMOUNT_OPTIONS,
  EMAIL_SUBJECT,
} from '@/config/constants'
import SuccessMessage from '@/ui/components/SuccessMesasge/SuccessMessage'
import SelectField from '@/ui/components/SelectField/SelectField'
import { IOption } from '@/types'
import { browserSendEmail } from '@/utils/email/bowserSendEmail'
import Skeleton from 'react-loading-skeleton'
import styles from './ApplyForFinancingDefault.module.scss'
import { messages } from '@/config/messages'
import PPMessage from '@/ui/components/PPMessage/PPMessage'

interface IApplyForFinancingDefault {
  className?: string
}

interface IFormInput {
  name: string
  business_name: string
  email: string
  amount_of_financing_requested: string
  average_of_monthly_sales: string
  phone: string
  business_objectives?: string
}

const ApplyForFinancingDefaultForm = ({
  className,
}: IApplyForFinancingDefault) => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    reset,
    setValue,
    clearErrors,
    trigger,
  } = useForm<IFormInput>({
    resolver: yupResolver(schema),
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false)
  const [submittedError, setSubmittedError] = useState<string | null>(null)

  const [isFocused, setIsFocused] = useState({
    name: false,
    business_name: false,
    email: false,
    amount_of_financing_requested: false,
    average_of_monthly_sales: false,
    phone: false,
    business_objectives: false,
  })

  const [consent, setConsent] = useState(false)

  // SPAM PROTECTION
  const [honeypot, setHoneypot] = useState('')
  const formStartTime = useRef<number>(Date.now())

  const handleBlur = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name } = e.target
    setIsFocused((prev) => ({
      ...prev,
      [name]: !!getValues(name as keyof IFormInput),
    }))
  }

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    // REMOVED CONSENT VALIDATION - checkbox is now optional
    // if (!consent) {
    //   alert('Please check the consent box to proceed.')
    //   return
    // }

    setIsSubmitting(true)
    try {
      // Send email to admin
      await browserSendEmail({
        subject: EMAIL_SUBJECT.FINANCING,
        htmlMessage: messages.admin(data),
        honeypot: honeypot,
        timestamp: formStartTime.current,
      })

      // Send confirmation email to user
      await browserSendEmail({
        to: data.email,
        subject: EMAIL_SUBJECT.FINANCING,
        htmlMessage: messages.user(),
        honeypot: honeypot,
        timestamp: formStartTime.current,
      })

      setIsSubmittedSuccess(true)

      setTimeout(() => {
        reset()
        setIsFocused({
          name: false,
          business_name: false,
          email: false,
          amount_of_financing_requested: false,
          average_of_monthly_sales: false,
          phone: false,
          business_objectives: false,
        })
        setConsent(false)
        formStartTime.current = Date.now()
      }, 1000)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setSubmittedError(error.response?.data?.message || 'Submission failed')
      setTimeout(() => setSubmittedError(null), 3000)
    } finally {
      setIsSubmitting(false)
      setTimeout(() => {
        setIsSubmittedSuccess(false)
      }, 5000)
    }
  }

  const handleChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const { name } = e.target
      setValue(name as keyof IFormInput, e.target.value)
      await trigger(name as keyof IFormInput)
    },
    [setValue, trigger],
  )

  const handleSelectChange = useCallback(
    (
      newValue: SingleValue<IOption> | MultiValue<IOption>,
      fieldName: keyof IFormInput,
    ) => {
      if (Array.isArray(newValue)) {
        newValue.forEach((option) => {
          if ('value' in option) {
            setValue(fieldName, option.value)
          }
        })
      } else {
        if (newValue && 'value' in newValue) {
          setValue(fieldName, newValue.value)
        }
      }
      clearErrors(fieldName)
    },
    [clearErrors, setValue],
  )

  return (
    <>
      <div className={classNames(styles.form, className)}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles['form-body']}>
          {/* HONEYPOT - Hidden spam trap */}
          <div
            style={{ position: 'absolute', left: '-9999px' }}
            aria-hidden="true"
          >
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className={styles['form-body-grid']}>
            <TextField
              {...register('name')}
              className={styles['form-body-grid-item']}
              placeholder="Full Name"
              error={errors.name?.message}
              isFocused={isFocused.name}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              {...register('business_name')}
              className={styles['form-body-grid-item']}
              placeholder="Business Name"
              error={errors.business_name?.message}
              isFocused={isFocused.business_name}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              {...register('phone')}
              className={styles['form-body-grid-item']}
              placeholder="Phone Number"
              error={errors.phone?.message}
              isFocused={isFocused.phone}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              {...register('email')}
              className={styles['form-body-grid-item']}
              placeholder="Email"
              error={errors.email?.message}
              isFocused={isFocused.email}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            {!isSubmittedSuccess ? (
              <>
                <SelectField
                  className={styles['form-body-grid-item']}
                  options={AMOUNT_OPTIONS}
                  placeholder="Amount of financing requested"
                  onChange={(newValue) =>
                    handleSelectChange(
                      newValue,
                      'amount_of_financing_requested',
                    )
                  }
                  error={errors.amount_of_financing_requested?.message}
                />
                <SelectField
                  className={styles['form-body-grid-item']}
                  options={AMOUNT_OPTIONS}
                  placeholder="What's your average monthly sales?"
                  onChange={(newValue) =>
                    handleSelectChange(newValue, 'average_of_monthly_sales')
                  }
                  error={errors.average_of_monthly_sales?.message}
                />
              </>
            ) : (
              <>
                <div className={styles['form-body-grid-item']}>
                  <Skeleton height="40rem" />
                </div>
                <div className={styles['form-body-grid-item']}>
                  <Skeleton height="40rem" />
                </div>
              </>
            )}
          </div>

          <TextAreaField
            {...register('business_objectives')}
            placeholder="Describe your business objectives!"
            isFocused={isFocused.business_objectives}
            onBlur={handleBlur}
          />

          {/* CHECKBOX - NOW OPTIONAL (removed 'required' attribute) */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              margin: '12px 0',
            }}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: '4px' }}
            />
            <span style={{ lineHeight: 1.4 }}>
              <PPMessage />
            </span>
          </label>

          <Button
            className={styles['form-action']}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <div className={styles['form-action-icon']}>
                <Image src="/animated-spinner.svg" alt="submitting" fill />
              </div>
            )}
            Submit
          </Button>

          {submittedError && (
            <p className={styles['form-error']}>{submittedError}</p>
          )}
        </form>
      </div>

      {isSubmittedSuccess && <SuccessMessage type="financing" />}
    </>
  )
}

export default ApplyForFinancingDefaultForm
