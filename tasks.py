from invoke import task

"""
To use this script you need to install 'invoke'.  This is best done globally using pip or pipx.

`pipx install invoke`

Afterword, you can execute any of these tasks in the terminal with `inv {task name}`.
"""


@task
def lint(ctx):
    ctx.run("poetry run ./molecule/lint")


@task(help={"scenario": "The test scenario you wish to run.  Default is the default scenario."})
def test(ctx, scenario="default"):
    ctx.run(f"poetry run molecule test -s {scenario}")
