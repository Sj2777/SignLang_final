export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  className = '',
  type = 'button',
  ...props
}) {
  const classes = ['button', `button-${variant}`, size === 'small' && 'button-small', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}
